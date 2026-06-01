import type { BrushSettings, Tool } from "../brush/types";
import type { PigmentLatent } from "../lib/mixbox";

export type SimulationStatus = "idle" | "initializing" | "ready" | "error";

export interface BrushInput {
  /** Pigment colour for the stroke, encoded once on the CPU. */
  latent: PigmentLatent;
  /** Brush preset + UI overrides (size, flow, spacing, dynamics…). */
  settings: BrushSettings;
  /** Pigment tinting strength (how strongly it dominates a mix). */
  tintingStrength: number;
  /** Active tool — paint or (spectral) smudge. */
  tool: Tool;
}

export interface SimulationMetrics {
  frameTimeMs: number;
  fps: number;
  textureResolution: { width: number; height: number };
}
