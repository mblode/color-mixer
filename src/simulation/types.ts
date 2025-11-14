import type { PigmentLatent } from '../lib/mixbox'

export type SimulationStatus = 'idle' | 'initializing' | 'ready' | 'error'

export interface BrushInput {
  hexA: string
  hexB: string
  ratio: number // 0-100
  activeSlot: 'A' | 'B'
  latentA: PigmentLatent
  latentB: PigmentLatent
}

export interface PointerState {
  x: number
  y: number
  prevX: number
  prevY: number
  active: boolean
}

export interface SimulationMetrics {
  frameTimeMs: number
  fps: number
  textureResolution: { width: number; height: number }
}
