/**
 * Engine-agnostic pigment-mixing contract.
 *
 * Two implementations exist: {@link MixboxEngine} (the SIGGRAPH-Asia-2021
 * latent model, a fidelity reference, CC BY-NC licensed) and
 * {@link SpectralEngine} (Kubelka-Munk via spectral.js, MIT licensed). The
 * GPU pipeline ports whichever engine is selected after benchmarking; keeping
 * a shared interface lets the audit compare them on identical inputs.
 */

import type { Rgb } from "./srgb";

/** A pigment participating in a mix. */
export interface PaintComponent {
  /** Pigment masstone in sRGB (0–1). */
  rgb: Rgb;
  /** Relative amount of this pigment in the mix (need not be normalised). */
  weight: number;
  /**
   * Tinting strength — how strongly the pigment dominates a mix relative to
   * its weight. A high-strength pigment (e.g. phthalo blue) overpowers a
   * weak one (e.g. titanium white) at a fraction of the volume. Default 1.
   */
  tintingStrength?: number;
}

export interface MixEngine {
  /** Stable identifier, e.g. `"mixbox"` or `"spectral"`. */
  readonly id: string;
  /** Human-readable label for UI / reports. */
  readonly label: string;
  /**
   * Mix the given pigments and return the resulting colour in sRGB (0–1).
   * Components with non-positive total weight yield the first component's
   * colour (or black if the list is empty).
   */
  mix(components: PaintComponent[]): Rgb;
}

export const DEFAULT_TINTING_STRENGTH = 1;

/** Resolve a component's effective tinting strength, defaulting to 1. */
export const tintingStrengthOf = (component: PaintComponent): number =>
  component.tintingStrength ?? DEFAULT_TINTING_STRENGTH;

/** Two-pigment convenience over {@link MixEngine.mix}. `t` is the amount of `b`. */
export const lerpMix = (engine: MixEngine, a: Rgb, b: Rgb, t: number): Rgb =>
  engine.mix([
    { rgb: a, weight: 1 - t },
    { rgb: b, weight: t },
  ]);
