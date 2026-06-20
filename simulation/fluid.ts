import { OIL_BRUSH } from "../brush/oil-brush";
import { Stroke } from "../brush/stroke";
import type { BrushSettings, Dab, StrokeSample } from "../brush/types";
import { DEFAULT_TINTING_STRENGTH } from "../lib/color/mix-engine";
import { ZERO_LATENT } from "../lib/mixbox";
import type { BrushInput, SimulationMetrics, SimulationStatus } from "./types";

const WORKGROUP_SIZE = 8;
const BRUSH_FLOAT_COUNT = 44;
const BRUSH_VEC4_COUNT = Math.ceil(BRUSH_FLOAT_COUNT / 4);
const BRUSH_UNIFORM_SIZE = BRUSH_VEC4_COUNT * 16;

// Latent accumulators hold an unbounded weighted sum of deposits; 16-bit float
// loses small increments once the running sum approaches 1 (audit finding F4),
// so the pigment buffers use full 32-bit float. textureLoad (not sampling) is
// used to read them, which works regardless of filterability.
const LATENT_FORMAT: GPUTextureFormat = "rgba32float";

// Dab buffer: 2 vec4s per dab — (x, y, radius, flow) and (angle, _, _, _).
const FLOATS_PER_DAB = 8;
const MAX_DABS_PER_FRAME = 4096;
// Per-dab deposit at the tip centre. Dabs overlap heavily (spacing ≪ diameter)
// so a single pass builds to full coverage; tuned for opaque oil build-up.
const STAMP_DEPOSIT = 0.32;
// Coverage (raw deposit) at which paint is fully opaque over the substrate.
const COVERAGE_FULL = 1;

interface PingPongTexture {
  label: string;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
  front: GPUTexture;
  back: GPUTexture;
}

interface SimulationCallbacks {
  onStatusChange?: (status: SimulationStatus, detail?: string) => void;
  onMetrics?: (metrics: SimulationMetrics) => void;
}

const createTexture = (
  device: GPUDevice,
  label: string,
  format: GPUTextureFormat,
  usage: GPUTextureUsageFlags,
  width: number,
  height: number
) =>
  device.createTexture({
    label,
    format,
    size: [Math.max(1, width), Math.max(1, height), 1],
    usage,
  });

const swapPingPong = (pair: PingPongTexture) => {
  const temp = pair.front;
  pair.front = pair.back;
  pair.back = temp;
};

export class FluidSimulation {
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: SimulationCallbacks;
  private context: GPUCanvasContext | null = null;
  private device: GPUDevice | null = null;
  private queue: GPUQueue | null = null;
  private presentationFormat: GPUTextureFormat = "bgra8unorm";
  // sRGB view format used for the render target so the GPU gamma-encodes the
  // linear-light shader output (audit finding F1).
  private renderFormat: GPUTextureFormat = "bgra8unorm-srgb";
  private dpr = window.devicePixelRatio || 1;
  private resizeObserver: ResizeObserver | null = null;
  private animationHandle: number | null = null;
  private brushUniformBuffer: GPUBuffer | null = null;
  private readonly brushUniformData = new Float32Array(BRUSH_FLOAT_COUNT);
  private dabBuffer: GPUBuffer | null = null;
  private readonly dabData = new Float32Array(
    MAX_DABS_PER_FRAME * FLOATS_PER_DAB
  );
  private latent0Textures: PingPongTexture | null = null;
  private latent1Textures: PingPongTexture | null = null;
  private computeLayout: GPUBindGroupLayout | null = null;
  private readonly pipelines: {
    stamp?: GPUComputePipeline;
    smudge?: GPUComputePipeline;
    clear?: GPUComputePipeline;
    render?: GPURenderPipeline;
  } = {};
  private size = { width: 0, height: 0 };

  private brushState: BrushInput = {
    latent: ZERO_LATENT,
    settings: OIL_BRUSH,
    tintingStrength: DEFAULT_TINTING_STRENGTH,
    tool: "paint",
  };
  private stroke: Stroke | null = null;
  private pendingDabs: Dab[] = [];
  private dabOverflowWarned = false;
  // Cached render bind group, invalidated whenever the latent front views change
  // (ping-pong swap or texture reallocation) so idle frames don't reallocate it.
  private renderBindGroup: GPUBindGroup | null = null;

  private lastTimestamp = 0;
  private readonly frameTimeSamples: number[] = [];
  private readonly FPS_SAMPLE_SIZE = 60;

  constructor(canvas: HTMLCanvasElement, callbacks: SimulationCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  async initialize() {
    try {
      this.emitStatus("initializing");
      if (!navigator.gpu) {
        throw new Error("WebGPU not available in this browser.");
      }

      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      if (!adapter) {
        throw new Error("Unable to acquire GPU adapter.");
      }

      const device = await adapter.requestDevice();
      this.device = device;
      this.queue = device.queue;
      const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
      this.presentationFormat = preferredFormat;
      this.renderFormat = `${preferredFormat}-srgb` as GPUTextureFormat;

      const context = this.canvas.getContext("webgpu");
      if (!context) {
        throw new Error("Failed to obtain GPUCanvasContext.");
      }
      this.context = context;

      this.configureContext();
      this.createResources();
      this.attachResizeObserver();
      this.startRenderLoop();
      this.emitStatus("ready", "WebGPU canvas ready");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Unknown WebGPU initialization error";
      this.emitStatus("error", message);
      throw error;
    }
  }

  destroy() {
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.latent0Textures?.front.destroy();
    this.latent0Textures?.back.destroy();
    this.latent1Textures?.front.destroy();
    this.latent1Textures?.back.destroy();
    this.brushUniformBuffer?.destroy();
    this.dabBuffer?.destroy();
  }

  clearSurface() {
    this.stroke = null;
    this.pendingDabs = [];
    this.clearTextures();
  }

  updateBrushInput(input: BrushInput) {
    this.brushState = input;
  }

  attachResizeObserver() {
    if (this.resizeObserver || !this.canvas) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvas) {
          const cr = entry.contentRect;
          this.handleResize(cr.width, cr.height);
        }
      }
    });
    this.resizeObserver.observe(this.canvas);
  }

  /** Begin a stroke at a device-pixel sample. */
  strokeBegin(sample: StrokeSample) {
    const minDim = Math.max(1, Math.min(this.size.width, this.size.height));
    this.stroke = new Stroke({
      settings: this.activeSettings(),
      minDimension: minDim,
    });
    this.enqueue(this.stroke.begin(sample));
  }

  /** Extend the current stroke with a new sample. */
  strokeExtend(sample: StrokeSample) {
    if (!this.stroke) {
      this.strokeBegin(sample);
      return;
    }
    this.enqueue(this.stroke.extend(sample));
  }

  /** End the current stroke. */
  strokeEnd() {
    this.stroke?.end();
    this.stroke = null;
  }

  private activeSettings(): BrushSettings {
    return this.brushState.settings;
  }

  private enqueue(dabs: Dab[]) {
    for (const dab of dabs) {
      if (this.pendingDabs.length >= MAX_DABS_PER_FRAME) {
        if (!this.dabOverflowWarned) {
          this.dabOverflowWarned = true;
          console.warn(
            `Brush dab buffer full (${MAX_DABS_PER_FRAME}); extra dabs dropped this frame.`
          );
        }
        break;
      }
      this.pendingDabs.push(dab);
    }
  }

  private configureContext() {
    if (!(this.device && this.context)) {
      return;
    }
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      viewFormats: [this.renderFormat],
      alphaMode: "premultiplied",
    });
    this.handleResize(
      this.canvas.clientWidth || 1,
      this.canvas.clientHeight || 1
    );
  }

  private handleResize(width: number, height: number) {
    if (!(this.device && this.context)) {
      return;
    }

    this.dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(width * this.dpr));
    const pixelHeight = Math.max(1, Math.round(height * this.dpr));

    if (pixelWidth === this.size.width && pixelHeight === this.size.height) {
      return;
    }

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.size = { width: pixelWidth, height: pixelHeight };

    this.allocateTextures();
  }

  private allocateTextures() {
    if (!this.device || this.size.width === 0 || this.size.height === 0) {
      return;
    }
    this.latent0Textures?.front.destroy();
    this.latent0Textures?.back.destroy();
    this.latent1Textures?.front.destroy();
    this.latent1Textures?.back.destroy();

    const usage =
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING;

    const makePair = (label: string): PingPongTexture => ({
      label,
      format: LATENT_FORMAT,
      usage,
      front: createTexture(
        this.device!,
        `${label}-front`,
        LATENT_FORMAT,
        usage,
        this.size.width,
        this.size.height
      ),
      back: createTexture(
        this.device!,
        `${label}-back`,
        LATENT_FORMAT,
        usage,
        this.size.width,
        this.size.height
      ),
    });

    this.latent0Textures = makePair("latent0");
    this.latent1Textures = makePair("latent1");
    this.renderBindGroup = null;

    this.clearTextures();
  }

  private swapLatentTextures() {
    if (this.latent0Textures) {
      swapPingPong(this.latent0Textures);
    }
    if (this.latent1Textures) {
      swapPingPong(this.latent1Textures);
    }
    this.renderBindGroup = null;
  }

  private computeBindGroup(): GPUBindGroup | undefined {
    if (
      !(
        this.device &&
        this.computeLayout &&
        this.latent0Textures &&
        this.latent1Textures &&
        this.brushUniformBuffer &&
        this.dabBuffer
      )
    ) {
      return;
    }
    return this.device.createBindGroup({
      layout: this.computeLayout,
      entries: [
        { binding: 0, resource: { buffer: this.brushUniformBuffer } },
        { binding: 1, resource: this.latent0Textures.front.createView() },
        { binding: 2, resource: this.latent0Textures.back.createView() },
        { binding: 3, resource: this.latent1Textures.front.createView() },
        { binding: 4, resource: this.latent1Textures.back.createView() },
        { binding: 5, resource: { buffer: this.dabBuffer } },
      ],
    });
  }

  private clearTextures() {
    if (
      !(
        this.device &&
        this.queue &&
        this.latent0Textures &&
        this.latent1Textures &&
        this.pipelines.clear
      )
    ) {
      return;
    }

    const encoder = this.device.createCommandEncoder({
      label: "pigment-clear",
    });
    const runClear = () => {
      const bindGroup = this.computeBindGroup();
      if (!bindGroup) {
        return;
      }
      const pass = encoder.beginComputePass({ label: "pigment-clear-pass" });
      pass.setPipeline(this.pipelines.clear!);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(
        Math.ceil(this.size.width / WORKGROUP_SIZE),
        Math.ceil(this.size.height / WORKGROUP_SIZE)
      );
      pass.end();
      this.swapLatentTextures();
    };

    runClear();
    runClear();
    this.queue.submit([encoder.finish()]);
  }

  private createResources() {
    if (!this.device) {
      return;
    }
    this.brushUniformBuffer = this.device.createBuffer({
      label: "brush-uniform",
      size: BRUSH_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.dabBuffer = this.device.createBuffer({
      label: "dab-buffer",
      size: this.dabData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.computeLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "unfilterable-float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: LATENT_FORMAT },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "unfilterable-float" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: LATENT_FORMAT },
        },
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
      ],
    });

    this.pipelines.stamp = this.createComputePipeline(
      "stamp",
      this.getStampShader()
    );
    this.pipelines.smudge = this.createComputePipeline(
      "smudge",
      this.getSmudgeShader()
    );
    this.pipelines.clear = this.createComputePipeline(
      "clear",
      this.getClearShader()
    );
    this.pipelines.render = this.createRenderPipeline();

    this.clearTextures();
  }

  private createComputePipeline(label: string, code: string) {
    if (!(this.device && this.computeLayout)) {
      return;
    }
    return this.device.createComputePipeline({
      label,
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.computeLayout],
      }),
      compute: {
        module: this.device.createShaderModule({
          code,
          label: `${label}-shader`,
        }),
        entryPoint: "main",
      },
    });
  }

  private createRenderPipeline() {
    if (!this.device) {
      return;
    }
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "unfilterable-float" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "unfilterable-float" },
        },
      ],
    });

    return this.device.createRenderPipeline({
      label: "pigment-canvas-render",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: this.getRenderVertexShader(),
        }),
        entryPoint: "main",
      },
      fragment: {
        module: this.device.createShaderModule({
          code: this.getRenderFragmentShader(),
        }),
        entryPoint: "main",
        targets: [{ format: this.renderFormat }],
      },
      primitive: { topology: "triangle-list" },
    });
  }

  private startRenderLoop() {
    const frame = (timestamp: number) => {
      this.step(timestamp);
      this.animationHandle = requestAnimationFrame(frame);
    };
    this.animationHandle = requestAnimationFrame(frame);
  }

  private step(timestamp: number) {
    if (
      !(
        this.device &&
        this.queue &&
        this.context &&
        this.latent0Textures &&
        this.latent1Textures &&
        this.brushUniformBuffer
      )
    ) {
      return;
    }

    const delta = this.lastTimestamp === 0 ? 0 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    const encoder = this.device.createCommandEncoder({
      label: "brush-encoder",
    });

    // The brush uniform and dab buffer are only read by the stamp/smudge pass,
    // so skip those GPU uploads entirely on idle frames (no dabs this frame).
    const dabCount = Math.min(this.pendingDabs.length, MAX_DABS_PER_FRAME);
    if (dabCount > 0) {
      this.uploadDabs(dabCount);
      this.updateBrushUniform(dabCount);
      const tool = this.brushState.tool;
      const brushPipeline =
        tool === "smudge" ? this.pipelines.smudge : this.pipelines.stamp;
      const bindGroup = this.computeBindGroup();
      if (brushPipeline && bindGroup) {
        const pass = encoder.beginComputePass({ label: `${tool}-pass` });
        pass.setPipeline(brushPipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(
          Math.ceil(this.size.width / WORKGROUP_SIZE),
          Math.ceil(this.size.height / WORKGROUP_SIZE)
        );
        pass.end();
        this.swapLatentTextures();
      }
    }
    this.pendingDabs.length = 0;

    this.renderPass(encoder);
    this.queue.submit([encoder.finish()]);
    this.emitMetrics(delta);
  }

  private renderPass(encoder: GPUCommandEncoder) {
    if (
      !(
        this.context &&
        this.device &&
        this.latent0Textures &&
        this.latent1Textures
      )
    ) {
      return;
    }
    const renderPipeline = this.pipelines.render;
    if (!renderPipeline) {
      return;
    }
    const view = this.context.getCurrentTexture().createView({
      label: "presentation-view",
      format: this.renderFormat,
    });
    if (!this.renderBindGroup) {
      this.renderBindGroup = this.device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.latent0Textures.front.createView() },
          { binding: 1, resource: this.latent1Textures.front.createView() },
        ],
      });
    }
    const renderBindGroup = this.renderBindGroup;
    const pass = encoder.beginRenderPass({
      label: "render-pass",
      colorAttachments: [
        {
          view,
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(renderPipeline);
    pass.setBindGroup(0, renderBindGroup);
    pass.draw(6, 1, 0, 0);
    pass.end();
  }

  private emitMetrics(delta: number) {
    if (delta > 0) {
      this.frameTimeSamples.push(delta);
      if (this.frameTimeSamples.length > this.FPS_SAMPLE_SIZE) {
        this.frameTimeSamples.shift();
      }
    }
    const avgFrameTime =
      this.frameTimeSamples.length > 0
        ? this.frameTimeSamples.reduce((sum, t) => sum + t, 0) /
          this.frameTimeSamples.length
        : delta;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    this.callbacks.onMetrics?.({
      frameTimeMs: delta,
      fps: Math.round(fps),
      textureResolution: { ...this.size },
    });
  }

  private uploadDabs(count: number) {
    if (!(this.queue && this.dabBuffer) || count === 0) {
      return;
    }
    const data = this.dabData;
    for (let i = 0; i < count; i++) {
      const dab = this.pendingDabs[i];
      const base = i * FLOATS_PER_DAB;
      data[base] = dab.x;
      data[base + 1] = dab.y;
      data[base + 2] = dab.radius;
      data[base + 3] = dab.flow;
      data[base + 4] = dab.angle;
      data[base + 5] = 0;
      data[base + 6] = 0;
      data[base + 7] = 0;
    }
    this.queue.writeBuffer(this.dabBuffer, 0, data, 0, count * FLOATS_PER_DAB);
  }

  private updateBrushUniform(dabCount: number) {
    if (!(this.queue && this.brushUniformBuffer)) {
      return;
    }
    const latent = this.brushState.latent;
    const tintingStrength = Number.isFinite(this.brushState.tintingStrength)
      ? Math.max(0, this.brushState.tintingStrength)
      : DEFAULT_TINTING_STRENGTH;

    const data = this.brushUniformData;
    data.fill(0);
    data[0] = this.size.width;
    data[1] = this.size.height;
    data[2] = dabCount;
    data[3] = this.activeSettings().smudgeLength;
    data[11] = tintingStrength;
    data[28] = latent[0];
    data[29] = latent[1];
    data[30] = latent[2];
    data[31] = latent[3];
    data[32] = latent[4];
    data[33] = latent[5];
    data[34] = latent[6];

    this.queue.writeBuffer(this.brushUniformBuffer, 0, data);
  }

  private emitStatus(status: SimulationStatus, detail?: string) {
    this.callbacks.onStatusChange?.(status, detail);
  }

  private getCommonShaderHeader() {
    return /* wgsl */ `
const BRUSH_VEC4_COUNT : u32 = ${BRUSH_VEC4_COUNT}u;

@group(0) @binding(0) var<uniform> brush : array<vec4<f32>, BRUSH_VEC4_COUNT>;
@group(0) @binding(1) var latent0Src : texture_2d<f32>;
@group(0) @binding(2) var latent0Dst : texture_storage_2d<${LATENT_FORMAT}, write>;
@group(0) @binding(3) var latent1Src : texture_2d<f32>;
@group(0) @binding(4) var latent1Dst : texture_storage_2d<${LATENT_FORMAT}, write>;
@group(0) @binding(5) var<storage, read> dabs : array<vec4<f32>>;

fn readScalar(offset : u32) -> f32 {
  let vecIndex = offset / 4u;
  let lane = offset % 4u;
  let v = brush[vecIndex];
  if (lane == 0u) { return v.x; }
  if (lane == 1u) { return v.y; }
  if (lane == 2u) { return v.z; }
  return v.w;
}

fn readVec4(offset : u32) -> vec4<f32> {
  return vec4<f32>(
    readScalar(offset),
    readScalar(offset + 1u),
    readScalar(offset + 2u),
    readScalar(offset + 3u)
  );
}

fn inBounds(coord: vec2<u32>, dims: vec2<u32>) -> bool {
  return coord.x < dims.x && coord.y < dims.y;
}

// Coverage / mix contribution of one dab at canvas point p — a clean, smooth
// round tip with a soft-but-defined edge and no surface pattern.
fn dabMask(p : vec2<f32>, center : vec2<f32>, radius : f32) -> f32 {
  let d = p - center;
  if (abs(d.x) > radius || abs(d.y) > radius) { return 0.0; }
  let distN = length(d) / radius;
  return 1.0 - smoothstep(0.55, 1.0, distN);
}
`;
  }

  private getStampShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(latent0Dst);
  if (!inBounds(gid.xy, dims)) { return; }
  let texel = vec2<i32>(gid.xy);
  var latent0 = textureLoad(latent0Src, texel, 0);
  var latent1 = textureLoad(latent1Src, texel, 0);

  let p = vec2<f32>(gid.xy) + vec2<f32>(0.5);
  let count = u32(readScalar(2u));
  let tintingStrength = max(0.0, readScalar(11u));
  let pigment0 = readVec4(28u);
  let pigment1 = readVec4(32u);

  for (var i = 0u; i < count; i = i + 1u) {
    let a = dabs[i * 2u];        // x, y, radius, flow
    let mask = dabMask(p, a.xy, max(1.0, a.z));
    if (mask <= 0.0) { continue; }
    let deposit = mask * a.w * ${STAMP_DEPOSIT};
    let mixDeposit = deposit * tintingStrength;
    latent0 = vec4<f32>(
      latent0.xyz + pigment0.xyz * mixDeposit,
      latent0.w + deposit
    );
    latent1 = vec4<f32>(
      latent1.xyz + pigment1.xyz * mixDeposit,
      latent1.w + mixDeposit
    );
  }

  textureStore(latent0Dst, texel, latent0);
  textureStore(latent1Dst, texel, latent1);
}`;
  }

  private getSmudgeShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(latent0Dst);
  if (!inBounds(gid.xy, dims)) { return; }
  let texel = vec2<i32>(gid.xy);
  let maxCoord = vec2<i32>(dims) - vec2<i32>(1);
  var latent0 = textureLoad(latent0Src, texel, 0);
  var latent1 = textureLoad(latent1Src, texel, 0);

  let p = vec2<f32>(gid.xy) + vec2<f32>(0.5);
  let count = u32(readScalar(2u));
  let smudgeLength = clamp(readScalar(3u), 0.0, 1.0);

  // Smudge drags the paint from BEHIND the brush onto the current pixel. Because
  // it lerps the accumulated latent (numerator AND weight together), the decoded
  // colour is a spectral Kubelka-Munk mix of the two — so dragging yellow into
  // wet blue yields green, unlike RGB smudge tools.
  for (var i = 0u; i < count; i = i + 1u) {
    let a = dabs[i * 2u];        // x, y, radius, flow
    let b = dabs[i * 2u + 1u];   // angle, _, _, _
    let radius = max(1.0, a.z);
    let mask = dabMask(p, a.xy, radius);
    if (mask <= 0.0) { continue; }
    let dir = vec2<f32>(cos(b.x), sin(b.x));
    let pickup = radius * 0.6;
    let src = clamp(texel - vec2<i32>(dir * pickup), vec2<i32>(0), maxCoord);
    let s0 = textureLoad(latent0Src, src, 0);
    let s1 = textureLoad(latent1Src, src, 0);
    let blend = clamp(smudgeLength * mask * a.w, 0.0, 1.0);
    latent0 = mix(latent0, s0, blend);
    latent1 = mix(latent1, s1, blend);
  }

  textureStore(latent0Dst, texel, latent0);
  textureStore(latent1Dst, texel, latent1);
}`;
  }

  private getClearShader() {
    return `${this.getCommonShaderHeader()}
@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = textureDimensions(latent0Dst);
  if (!inBounds(gid.xy, dims)) { return; }
  textureStore(latent0Dst, vec2<i32>(gid.xy), vec4<f32>(0.0));
  textureStore(latent1Dst, vec2<i32>(gid.xy), vec4<f32>(0.0));
}`;
  }

  private getRenderVertexShader() {
    return /* wgsl */ `
struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
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
}`;
  }

  private getRenderFragmentShader() {
    return /* wgsl */ `
@group(0) @binding(0) var latent0Texture : texture_2d<f32>;
@group(0) @binding(1) var latent1Texture : texture_2d<f32>;

fn srgbChannelToLinear(c : f32) -> f32 {
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return pow((c + 0.055) / 1.055, 2.4);
}

fn srgbToLinear(c : vec3<f32>) -> vec3<f32> {
  return vec3<f32>(
    srgbChannelToLinear(c.x),
    srgbChannelToLinear(c.y),
    srgbChannelToLinear(c.z)
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
  w = c0 * c00; r += 0.07717053 * w; g += 0.02826978 * w; b += 0.24832992 * w;
  w = c1 * c11; r += 0.95912302 * w; g += 0.80256528 * w; b += 0.03561839 * w;
  w = c2 * c22; r += 0.74683774 * w; g += 0.04868586 * w; b += 0.00000000 * w;
  w = c3 * c33; r += 0.99518138 * w; g += 0.99978149 * w; b += 0.99704802 * w;
  w = c00 * c1; r += 0.04819146 * w; g += 0.83363781 * w; b += 0.32515377 * w;
  w = c01 * c1; r += -0.68146950 * w; g += 1.46107803 * w; b += 1.06980936 * w;
  w = c00 * c2; r += 0.27058419 * w; g += -0.15324870 * w; b += 1.98735057 * w;
  w = c02 * c2; r += 0.80478189 * w; g += 0.67093710 * w; b += 0.18424500 * w;
  w = c00 * c3; r += -0.35031003 * w; g += 1.37855826 * w; b += 3.68865000 * w;
  w = c0 * c33; r += 1.05128046 * w; g += 1.97815239 * w; b += 2.82989073 * w;
  w = c11 * c2; r += 3.21607125 * w; g += 0.81270228 * w; b += 1.03384539 * w;
  w = c1 * c22; r += 2.78893374 * w; g += 0.41565549 * w; b += -0.04487295 * w;
  w = c11 * c3; r += 3.02162577 * w; g += 2.55374103 * w; b += 0.32766114 * w;
  w = c1 * c33; r += 2.95124691 * w; g += 2.81201112 * w; b += 1.17578442 * w;
  w = c22 * c3; r += 2.82677043 * w; g += 0.79933038 * w; b += 1.81715262 * w;
  w = c2 * c33; r += 2.99691099 * w; g += 1.22593053 * w; b += 1.80653661 * w;
  w = c01 * c2; r += 1.87394106 * w; g += 2.05027182 * w; b += -0.29835996 * w;
  w = c01 * c3; r += 2.56609566 * w; g += 7.03428198 * w; b += 0.62575374 * w;
  w = c02 * c3; r += 4.08329484 * w; g += -1.40408358 * w; b += 2.14995522 * w;
  w = c12 * c3; r += 6.00078678 * w; g += 2.55552042 * w; b += 1.90739502 * w;

  return vec3<f32>(r, g, b);
}

@fragment fn main(@location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
  let dims = textureDimensions(latent0Texture);
  let maxCoord = vec2<i32>(dims) - vec2<i32>(1);
  let texel = clamp(vec2<i32>(uv * vec2<f32>(dims)), vec2<i32>(0), maxCoord);
  let latent0 = textureLoad(latent0Texture, texel, 0);
  let latent1 = textureLoad(latent1Texture, texel, 0);

  let background = vec3<f32>(1.0);
  let mixWeight = latent1.w;
  if (mixWeight <= 1e-5) {
    return vec4<f32>(background, 1.0);
  }

  let inv = 1.0 / mixWeight;
  let c0 = latent0.x * inv;
  let c1 = latent0.y * inv;
  let c2 = latent0.z * inv;
  let c3 = 1.0 - c0 - c1 - c2;
  let residual = latent1.xyz * inv;
  let paintSrgb = clamp(
    evalPolynomial(c0, c1, c2, c3) + residual,
    vec3<f32>(0.0),
    vec3<f32>(1.0)
  );

  let coverage = clamp(latent0.w / ${COVERAGE_FULL}.0, 0.0, 1.0);
  let paintLinear = srgbToLinear(paintSrgb);
  let color = background * (1.0 - coverage) + paintLinear * coverage;
  return vec4<f32>(color, 1.0);
}`;
  }
}
