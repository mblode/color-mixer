/** Brush-engine data types: input samples, dabs, and tunable brush settings. */

export type Tool = "paint" | "smudge";

/** A raw pointer sample fed into a stroke. Coordinates are in canvas pixels. */
export interface StrokeSample {
  x: number;
  y: number;
  /** Stylus pressure (0–1); simulated from velocity for mouse/trackpad. */
  pressure: number;
  /** Event timestamp in milliseconds (e.g. `PointerEvent.timeStamp`). */
  time: number;
}

/**
 * A single brush-tip stamp emitted along the stroke. The GPU stamps these into
 * the canvas; pigment colour is constant per stroke and lives in the brush
 * uniform, so it is not repeated per dab.
 */
export interface Dab {
  x: number;
  y: number;
  /** Tip radius in pixels (after pressure/velocity dynamics). */
  radius: number;
  /** Per-dab paint deposition rate (0–1) — "flow". */
  flow: number;
  /** Tip rotation in radians, following the stroke direction. */
  angle: number;
}

/**
 * A simple two-point response curve mapping an input sensor (0–1) to an output
 * multiplier. `atZero`/`atOne` are the output at input 0 and 1; `gamma` shapes
 * the curve between them (1 = linear, >1 = ease-in).
 */
export interface ResponseCurve {
  atZero: number;
  atOne: number;
  gamma: number;
}

export const evalCurve = (curve: ResponseCurve, input: number): number => {
  const t = Math.min(1, Math.max(0, input)) ** curve.gamma;
  return curve.atZero + (curve.atOne - curve.atZero) * t;
};

/** Tunable settings that define a brush preset. */
export interface BrushSettings {
  /** Base tip diameter as a fraction of the smaller canvas dimension. */
  size: number;
  /** Dab spacing as a fraction of tip diameter (≈0.05–0.2 for smooth strokes). */
  spacing: number;
  /** Base per-dab flow (0–1). */
  flow: number;
  /** Stroke opacity ceiling (0–1) — overlapping dabs never exceed this. */
  opacity: number;
  /** Tip edge softness (0 = hard, 1 = very soft). */
  hardness: number;
  /** 1€ filter strength (0 = raw, 1 = heavily stabilised). */
  smoothing: number;
  /** Size multiplier as a function of pressure. */
  pressureToSize: ResponseCurve;
  /** Flow multiplier as a function of pressure. */
  pressureToFlow: ResponseCurve;
  /** Size multiplier as a function of normalised speed (0 = slow, 1 = fast). */
  speedToSize: ResponseCurve;
  /** Flow multiplier as a function of normalised speed. */
  speedToFlow: ResponseCurve;
  /** Per-dab positional jitter as a fraction of radius. */
  scatter: number;
  /** Smudge: how much picked-up colour persists between dabs (0–1). */
  smudgeLength: number;
  /** Smudge: how much fresh brush colour mixes in per dab (0–1). */
  smudgeColorRate: number;
}
