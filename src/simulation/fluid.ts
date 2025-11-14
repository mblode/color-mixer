import tgpu from 'typegpu'
import { hexToRgb, ZERO_LATENT } from '../lib/mixbox'
import type { BrushInput, SimulationMetrics, SimulationStatus } from './types'

const WORKGROUP_SIZE = 8
const BRUSH_FLOAT_COUNT = 44
const BRUSH_UNIFORM_SIZE = BRUSH_FLOAT_COUNT * 4

interface PingPongTexture {
  label: string
  format: GPUTextureFormat
  usage: GPUTextureUsageFlags
  front: GPUTexture
  back: GPUTexture
}

interface SimulationCallbacks {
  onStatusChange?: (status: SimulationStatus, detail?: string) => void
  onMetrics?: (metrics: SimulationMetrics) => void
}

interface PointerSnapshot {
  x: number
  y: number
  prevX: number
  prevY: number
  active: boolean
}

const createTexture = (
  device: GPUDevice,
  label: string,
  format: GPUTextureFormat,
  usage: GPUTextureUsageFlags,
  width: number,
  height: number,
) =>
  device.createTexture({
    label,
    format,
    size: [Math.max(1, width), Math.max(1, height), 1],
    usage,
  })

const swapPingPong = (pair: PingPongTexture) => {
  const temp = pair.front
  pair.front = pair.back
  pair.back = temp
}

export class FluidSimulation {
  private canvas: HTMLCanvasElement
  private callbacks: SimulationCallbacks
  private context: GPUCanvasContext | null = null
  private device: GPUDevice | null = null
  private queue: GPUQueue | null = null
  private root: Awaited<ReturnType<typeof tgpu.initFromDevice>> | null = null
  private sampler: GPUSampler | null = null
  private presentationFormat: GPUTextureFormat = 'bgra8unorm'
  private dpr = window.devicePixelRatio || 1
  private resizeObserver: ResizeObserver | null = null
  private animationHandle: number | null = null
  private brushUniformBuffer: GPUBuffer | null = null
  private brushUniformData = new Float32Array(BRUSH_FLOAT_COUNT)
  private pigmentTextures: PingPongTexture | null = null
  private computeLayout: GPUBindGroupLayout | null = null
  private pipelines: {
    forces?: GPUComputePipeline
    advection?: GPUComputePipeline
    diffusion?: GPUComputePipeline
    pressure?: GPUComputePipeline
    pigment?: GPUComputePipeline
    render?: GPURenderPipeline
  } = {}
  private size = { width: 0, height: 0 }
  private pointer: PointerSnapshot = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, active: false }
  private brushState: BrushInput = {
    hexA: '#ffffff',
    hexB: '#ffffff',
    ratio: 50,
    activeSlot: 'A',
    latentA: ZERO_LATENT,
    latentB: ZERO_LATENT,
  }
  private lastTimestamp = 0
  private paused = false
  private frameTimeSamples: number[] = []
  private readonly FPS_SAMPLE_SIZE = 60

  constructor(canvas: HTMLCanvasElement, callbacks: SimulationCallbacks = {}) {
    this.canvas = canvas
    this.callbacks = callbacks
  }

  async initialize() {
    try {
      this.emitStatus('initializing')
      if (!navigator.gpu) {
        throw new Error('WebGPU not available in this browser.')
      }

      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
      if (!adapter) {
        throw new Error('Unable to acquire GPU adapter.')
      }

      const device = await adapter.requestDevice()
      this.device = device
      this.queue = device.queue
      this.root = tgpu.initFromDevice({ device })
      this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()

      const context = this.canvas.getContext('webgpu')
      if (!context) {
        throw new Error('Failed to obtain GPUCanvasContext.')
      }
      this.context = context

      this.configureContext()
      this.createResources()
      this.attachResizeObserver()
      this.startRenderLoop()
      this.emitStatus('ready', 'WebGPU canvas ready')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Unknown WebGPU initialization error'
      this.emitStatus('error', message)
      throw error
    }
  }

  destroy() {
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle)
      this.animationHandle = null
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.pigmentTextures?.front.destroy()
    this.pigmentTextures?.back.destroy()
    this.brushUniformBuffer?.destroy()
    this.root?.destroy()
  }

  setPaused(paused: boolean) {
    this.paused = paused
    if (!paused) {
      this.lastTimestamp = 0
    }
  }

  clearSurface() {
    this.pointer = { ...this.pointer, active: false }
    this.allocateTextures()
  }

  updateBrushInput(input: BrushInput) {
    this.brushState = input
  }

  attachResizeObserver() {
    if (this.resizeObserver || !this.canvas) return
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvas) {
          const cr = entry.contentRect
          this.handleResize(cr.width, cr.height)
        }
      }
    })
    this.resizeObserver.observe(this.canvas)
  }

  handlePointerDown(x: number, y: number) {
    this.pointer = { ...this.pointer, x, y, prevX: x, prevY: y, active: true }
  }

  handlePointerMove(x: number, y: number) {
    if (!this.pointer.active) return
    this.pointer = { ...this.pointer, prevX: this.pointer.x, prevY: this.pointer.y, x, y }
  }

  handlePointerUp() {
    this.pointer = { ...this.pointer, active: false }
  }

  private configureContext() {
    if (!this.device || !this.context) {
      return
    }
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: 'premultiplied',
    })
    this.handleResize(this.canvas.clientWidth || 1, this.canvas.clientHeight || 1)
  }

  private handleResize(width: number, height: number) {
    if (!this.device || !this.context) {
      return
    }

    this.dpr = window.devicePixelRatio || 1
    const pixelWidth = Math.max(1, Math.round(width * this.dpr))
    const pixelHeight = Math.max(1, Math.round(height * this.dpr))

    if (pixelWidth === this.size.width && pixelHeight === this.size.height) {
      return
    }

    this.canvas.width = pixelWidth
    this.canvas.height = pixelHeight
    this.size = { width: pixelWidth, height: pixelHeight }

    this.allocateTextures()
    this.updateBrushUniform(this.lastTimestamp)
  }

  private allocateTextures() {
    if (!this.device || this.size.width === 0 || this.size.height === 0) return
    this.pigmentTextures?.front.destroy()
    this.pigmentTextures?.back.destroy()

    const usage =
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING

    this.pigmentTextures = {
      label: 'pigment-density',
      format: 'rgba16float',
      usage,
      front: createTexture(this.device, 'pigment-front', 'rgba16float', usage, this.size.width, this.size.height),
      back: createTexture(this.device, 'pigment-back', 'rgba16float', usage, this.size.width, this.size.height),
    }
  }

  private createResources() {
    if (!this.device) return
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })

    this.brushUniformBuffer = this.device.createBuffer({
      label: 'brush-uniform',
      size: BRUSH_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.computeLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, sampler: { type: 'filtering' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: 'write-only', format: 'rgba16float' },
        },
      ],
    })

    this.pipelines.forces = this.createComputePipeline('forces', this.getForcesShader())
    this.pipelines.advection = this.createComputePipeline('advection', this.getAdvectionShader())
    this.pipelines.diffusion = this.createComputePipeline('diffusion', this.getDiffusionShader())
    this.pipelines.pressure = this.createComputePipeline('pressure', this.getPressureShader())
    this.pipelines.pigment = this.createComputePipeline('pigment-transport', this.getPigmentShader())
    this.pipelines.render = this.createRenderPipeline()
  }

  private createComputePipeline(label: string, code: string) {
    if (!this.device || !this.computeLayout) return undefined
    return this.device.createComputePipeline({
      label,
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.computeLayout] }),
      compute: {
        module: this.device.createShaderModule({ code, label: `${label}-shader` }),
        entryPoint: 'main',
      },
    })
  }

  private createRenderPipeline() {
    if (!this.device) return undefined
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      ],
    })

    return this.device.createRenderPipeline({
      label: 'pigment-canvas-render',
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: this.device.createShaderModule({ code: this.getRenderVertexShader() }),
        entryPoint: 'main',
      },
      fragment: {
        module: this.device.createShaderModule({ code: this.getRenderFragmentShader() }),
        entryPoint: 'main',
        targets: [{ format: this.presentationFormat }],
      },
      primitive: { topology: 'triangle-list' },
    })
  }

  private startRenderLoop() {
    const frame = (timestamp: number) => {
      if (!this.paused) {
        this.step(timestamp)
      } else {
        this.lastTimestamp = timestamp
      }
      this.animationHandle = requestAnimationFrame(frame)
    }
    this.animationHandle = requestAnimationFrame(frame)
  }

  private step(timestamp: number) {
    if (!this.device || !this.queue || !this.context || !this.pigmentTextures || !this.brushUniformBuffer) {
      return
    }

    const delta = this.lastTimestamp === 0 ? 0 : timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    this.updateBrushUniform(timestamp)

    const encoder = this.device.createCommandEncoder({ label: 'fluid-simulation-encoder' })

    const runPipeline = (pipeline?: GPUComputePipeline) => {
      if (!pipeline || !this.computeLayout || !this.sampler || !this.pigmentTextures) return
      const bindGroup = this.device!.createBindGroup({
        layout: this.computeLayout,
        entries: [
          { binding: 0, resource: { buffer: this.brushUniformBuffer! } },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: this.pigmentTextures!.front.createView() },
          { binding: 3, resource: this.pigmentTextures!.back.createView() },
        ],
      })

      const pass = encoder.beginComputePass({ label: pipeline.label })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      const workgroupX = Math.ceil(this.size.width / WORKGROUP_SIZE)
      const workgroupY = Math.ceil(this.size.height / WORKGROUP_SIZE)
      pass.dispatchWorkgroups(workgroupX, workgroupY)
      pass.end()
      swapPingPong(this.pigmentTextures!)
    }

    runPipeline(this.pipelines.forces)
    runPipeline(this.pipelines.advection)
    runPipeline(this.pipelines.diffusion)
    runPipeline(this.pipelines.pressure)
    runPipeline(this.pipelines.pigment)

    const currentTexture = this.context.getCurrentTexture()
    const view = currentTexture.createView({ label: 'presentation-view' })

    const renderPipeline = this.pipelines.render
    if (renderPipeline && this.sampler) {
      const renderBindGroup = this.device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.brushUniformBuffer! } },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: this.pigmentTextures.front.createView() },
        ],
      })

      const pass = encoder.beginRenderPass({
        label: 'fluid-render-pass',
        colorAttachments: [
          {
            view,
            clearValue: { r: 0.01, g: 0.01, b: 0.02, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })
      pass.setPipeline(renderPipeline)
      pass.setBindGroup(0, renderBindGroup)
      pass.draw(6, 1, 0, 0)
      pass.end()
    }

    this.queue.submit([encoder.finish()])

    // Calculate FPS using rolling average
    if (delta > 0) {
      this.frameTimeSamples.push(delta)
      if (this.frameTimeSamples.length > this.FPS_SAMPLE_SIZE) {
        this.frameTimeSamples.shift()
      }
    }
    const avgFrameTime = this.frameTimeSamples.length > 0
      ? this.frameTimeSamples.reduce((sum, t) => sum + t, 0) / this.frameTimeSamples.length
      : delta
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0

    this.callbacks.onMetrics?.({
      frameTimeMs: delta,
      fps: Math.round(fps),
      textureResolution: { ...this.size },
    })
  }

  private updateBrushUniform(timestamp: number) {
    if (!this.queue || !this.brushUniformBuffer) return

    const { width, height } = this.size
    const pointerDown = this.pointer.active ? 1 : 0
    const ratio = Math.min(1, Math.max(0, this.brushState.ratio / 100))
    const colorA = hexToRgb(this.brushState.hexA).map((value) => value / 255)
    const colorB = hexToRgb(this.brushState.hexB).map((value) => value / 255)
    const activeColor = this.brushState.activeSlot === 'A' ? colorA : colorB
    const latentA = this.brushState.latentA
    const latentB = this.brushState.latentB

    const brushRadius = 0.2 * Math.min(width || 1, height || 1)

    const data = this.brushUniformData
    data[0] = width
    data[1] = height
    data[2] = this.pointer.x
    data[3] = this.pointer.y

    data[4] = this.pointer.prevX
    data[5] = this.pointer.prevY
    data[6] = pointerDown
    data[7] = brushRadius

    data[8] = ratio
    data[9] = this.brushState.activeSlot === 'A' ? 0 : 1
    data[10] = timestamp * 0.001
    data[11] = 0

    data[12] = 0
    data[13] = 0
    data[14] = 0
    data[15] = 0

    data[16] = colorA[0]
    data[17] = colorA[1]
    data[18] = colorA[2]
    data[19] = 1

    data[20] = colorB[0]
    data[21] = colorB[1]
    data[22] = colorB[2]
    data[23] = 1

    data[24] = activeColor[0]
    data[25] = activeColor[1]
    data[26] = activeColor[2]
    data[27] = 1

    data[28] = latentA[0]
    data[29] = latentA[1]
    data[30] = latentA[2]
    data[31] = latentA[3]

    data[32] = latentA[4]
    data[33] = latentA[5]
    data[34] = latentA[6]
    data[35] = 0

    data[36] = latentB[0]
    data[37] = latentB[1]
    data[38] = latentB[2]
    data[39] = latentB[3]

    data[40] = latentB[4]
    data[41] = latentB[5]
    data[42] = latentB[6]
    data[43] = 0

    this.queue.writeBuffer(this.brushUniformBuffer, 0, data)
  }

  private emitStatus(status: SimulationStatus, detail?: string) {
    this.callbacks.onStatusChange?.(status, detail)
  }

  private getCommonShaderHeader() {
    return /* wgsl */ `
const BRUSH_FLOAT_COUNT : u32 = ${BRUSH_FLOAT_COUNT}u;

@group(0) @binding(0) var<uniform> brush : array<f32, BRUSH_FLOAT_COUNT>;
@group(0) @binding(1) var linearSampler : sampler;
@group(0) @binding(2) var pigmentSrc : texture_2d<f32>;
@group(0) @binding(3) var pigmentDst : texture_storage_2d<rgba16float, write>;

fn readVec2(offset : u32) -> vec2<f32> {
  return vec2<f32>(brush[offset], brush[offset + 1u]);
}

fn readVec4(offset : u32) -> vec4<f32> {
  return vec4<f32>(
    brush[offset],
    brush[offset + 1u],
    brush[offset + 2u],
    brush[offset + 3u]
  );
}

fn readScalar(offset : u32) -> f32 {
  return brush[offset];
}

fn inBounds(coord: vec2<u32>, dims: vec2<u32>) -> bool {
  return coord.x < dims.x && coord.y < dims.y;
}

fn texelUv(coord: vec2<u32>, dims: vec2<u32>) -> vec2<f32> {
  return (vec2<f32>(coord) + vec2<f32>(0.5)) / vec2<f32>(dims);
}
`
  }

  private getForcesShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(pigmentDst);
  if (!inBounds(gid.xy, dims)) { return; }
  let uv = texelUv(gid.xy, dims);
  var texel = textureSampleLevel(pigmentSrc, linearSampler, uv, 0.0);
  let resolution = readVec2(0u);
  let pointer = readVec2(2u);
  let meta = readVec4(6u);
  if (meta.x > 0.5) {
    let pointerUv = pointer / resolution;
    let diff = (uv - pointerUv) * resolution;
    let dist = length(diff);
    let influence = max(0.0, 1.0 - dist / meta.y);
    let colorA = readVec4(16u).rgb;
    let colorB = readVec4(20u).rgb;
    let pigmentRatio = meta.z;
    texel.rgb = texel.rgb + (mix(colorB, colorA, pigmentRatio) - texel.rgb) * influence;
    texel.a = max(texel.a, influence);
  }
  textureStore(pigmentDst, vec2<i32>(gid.xy), texel);
}`
  }

  private getAdvectionShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(pigmentDst);
  if (!inBounds(gid.xy, dims)) { return; }
  let uv = texelUv(gid.xy, dims);
  let timeValue = readScalar(10u);
  let velocity = vec2<f32>(sin(timeValue * 0.05), cos(timeValue * 0.05)) * 0.0025;
  let sampleUv = clamp(uv - velocity, vec2<f32>(0.0), vec2<f32>(1.0));
  let texel = textureSampleLevel(pigmentSrc, linearSampler, sampleUv, 0.0);
  textureStore(pigmentDst, vec2<i32>(gid.xy), texel);
}`
  }

  private getDiffusionShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(pigmentDst);
  if (!inBounds(gid.xy, dims)) { return; }
  let texSize = vec2<f32>(dims);
  let uv = texelUv(gid.xy, dims);
  let offset = 1.0 / texSize;
  var sum = vec4<f32>(0.0);
  sum += textureSampleLevel(pigmentSrc, linearSampler, uv, 0.0);
  sum += textureSampleLevel(pigmentSrc, linearSampler, uv + vec2<f32>( offset.x, 0.0), 0.0);
  sum += textureSampleLevel(pigmentSrc, linearSampler, uv + vec2<f32>(-offset.x, 0.0), 0.0);
  sum += textureSampleLevel(pigmentSrc, linearSampler, uv + vec2<f32>(0.0,  offset.y), 0.0);
  sum += textureSampleLevel(pigmentSrc, linearSampler, uv + vec2<f32>(0.0, -offset.y), 0.0);
  textureStore(pigmentDst, vec2<i32>(gid.xy), sum / 5.0);
}`
  }

  private getPressureShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(pigmentDst);
  if (!inBounds(gid.xy, dims)) { return; }
  let uv = texelUv(gid.xy, dims);
  var texel = textureSampleLevel(pigmentSrc, linearSampler, uv, 0.0);
  texel.rg *= 0.997;
  texel.a *= 0.99;
  textureStore(pigmentDst, vec2<i32>(gid.xy), texel);
}`
  }

  private getPigmentShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(pigmentDst);
  if (!inBounds(gid.xy, dims)) { return; }
  let uv = texelUv(gid.xy, dims);
  var texel = textureSampleLevel(pigmentSrc, linearSampler, uv, 0.0);
  texel.b = 0.0;
  textureStore(pigmentDst, vec2<i32>(gid.xy), texel);
}`
  }

  private getRenderVertexShader() {
    return /* wgsl */ `
struct VSOut {
  @builtin(position) position : vec4<f32>;
  @location(0) uv : vec2<f32>;
};

@vertex fn main(@builtin(vertex_index) vertexIndex : u32) -> VSOut {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  var vsOut : VSOut;
  vsOut.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  vsOut.uv = (positions[vertexIndex] + vec2<f32>(1.0)) * 0.5;
  vsOut.uv.y = 1.0 - vsOut.uv.y;
  return vsOut;
}`
  }

  private getRenderFragmentShader() {
    return /* wgsl */ `
const BRUSH_FLOAT_COUNT : u32 = ${BRUSH_FLOAT_COUNT}u;

@group(0) @binding(0) var<uniform> brush : array<f32, BRUSH_FLOAT_COUNT>;
@group(0) @binding(1) var linearSampler : sampler;
@group(0) @binding(2) var pigmentTexture : texture_2d<f32>;

fn readVec4(offset : u32) -> vec4<f32> {
  return vec4<f32>(
    brush[offset],
    brush[offset + 1u],
    brush[offset + 2u],
    brush[offset + 3u]
  );
}

fn evalPolynomial(c0: f32, c1: f32, c2: f32, c3: f32) -> vec3<f32> {
  let c00 = c0 * c0;
  let c11 = c1 * c1;
  let c22 = c2 * c2;
  let c33 = c3 * c3;
  let c01 = c0 * c1;
  let c02 = c0 * c2;
  let c12 = c1 * c2;

  var r = 0.0;
  var g = 0.0;
  var b = 0.0;

  var w = 0.0;
  w = c0*c00; r += +0.07717053*w; g += +0.02826978*w; b += +0.24832992*w;
  w = c1*c11; r += +0.95912302*w; g += +0.80256528*w; b += +0.03561839*w;
  w = c2*c22; r += +0.74683774*w; g += +0.04868586*w; b += +0.00000000*w;
  w = c3*c33; r += +0.99518138*w; g += +0.99978149*w; b += +0.99704802*w;
  w = c00*c1; r += +0.04819146*w; g += +0.83363781*w; b += +0.32515377*w;
  w = c01*c1; r += -0.68146950*w; g += +1.46107803*w; b += +1.06980936*w;
  w = c00*c2; r += +0.27058419*w; g += -0.15324870*w; b += +1.98735057*w;
  w = c02*c2; r += +0.80478189*w; g += +0.67093710*w; b += +0.18424500*w;
  w = c00*c3; r += -0.35031003*w; g += +1.37855826*w; b += +3.68865000*w;
  w = c0*c33; r += +1.05128046*w; g += +1.97815239*w; b += +2.82989073*w;
  w = c11*c2; r += +3.21607125*w; g += +0.81270228*w; b += +1.03384539*w;
  w = c1*c22; r += +2.78893374*w; g += +0.41565549*w; b += -0.04487295*w;
  w = c11*c3; r += +3.02162577*w; g += +2.55374103*w; b += +0.32766114*w;
  w = c1*c33; r += +2.95124691*w; g += +2.81201112*w; b += +1.17578442*w;
  w = c22*c3; r += +2.82677043*w; g += +0.79933038*w; b += +1.81715262*w;
  w = c2*c33; r += +2.99691099*w; g += +1.22593053*w; b += +1.80653661*w;
  w = c01*c2; r += +1.87394106*w; g += +2.05027182*w; b += -0.29835996*w;
  w = c01*c3; r += +2.56609566*w; g += +7.03428198*w; b += +0.62575374*w;
  w = c02*c3; r += +4.08329484*w; g += -1.40408358*w; b += +2.14995522*w;
  w = c12*c3; r += +6.00078678*w; g += +2.55552042*w; b += +1.90739502*w;

  return vec3<f32>(r, g, b);
}

fn latentToColor(latent0: vec4<f32>, latent1: vec4<f32>) -> vec3<f32> {
  let base = evalPolynomial(latent0.x, latent0.y, latent0.z, latent0.w);
  let color = base + latent1.xyz;
  return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn mixLatent(t: f32) -> vec3<f32> {
  let latentB0 = readVec4(36u);
  let latentB1 = readVec4(40u);
  let latentA0 = readVec4(28u);
  let latentA1 = readVec4(32u);
  let latent0 = mix(latentB0, latentA0, t);
  let latent1 = mix(latentB1, latentA1, t);
  return latentToColor(latent0, latent1);
}

@fragment fn main(@location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
  let texel = textureSampleLevel(pigmentTexture, linearSampler, uv, 0.0);
  let total = texel.r + texel.g;
  if (total <= 1e-5) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }
  let ratio = clamp(texel.r / total, 0.0, 1.0);
  let color = mixLatent(ratio) * clamp(total, 0.0, 1.0);
  return vec4<f32>(color, 1.0);
}`
  }
}
