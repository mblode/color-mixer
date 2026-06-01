import { describe, expect, it } from "vitest";
import { deltaE, rgbToLab } from "./delta-e";
import { lerpMix, type MixEngine } from "./mix-engine";
import { MixboxEngine } from "./mixbox-engine";
import { SpectralEngine } from "./spectral-engine";
import { hexToRgb, type Rgb } from "./srgb";

const BLUE = hexToRgb("#0000FF");
const YELLOW = hexToRgb("#FFFF00");
const WHITE = hexToRgb("#FFFFFF");
const PHTHALO = hexToRgb("#0D1B44");

const engines: MixEngine[] = [new MixboxEngine(), new SpectralEngine()];

// The defining property of subtractive pigment mixing: blue + yellow makes a
// GREEN, where additive RGB averaging makes a desaturated grey (a* ≈ 0).
describe.each(engines)("$label — physical pigment behaviour", (engine) => {
  it("mixes blue + yellow into a green (negative a*), not grey", () => {
    const mixed = lerpMix(engine, BLUE, YELLOW, 0.5);
    const lab = rgbToLab(mixed);
    // Green occupies the −a* half-plane; a muddy grey would sit near 0.
    expect(lab.a).toBeLessThan(-15);
    // Green channel should dominate the result.
    expect(mixed[1]).toBeGreaterThan(mixed[0]);
    expect(mixed[1]).toBeGreaterThan(mixed[2]);
  });

  it("keeps white + phthalo blue distinctly blue (negative b*)", () => {
    const mixed = lerpMix(engine, WHITE, PHTHALO, 0.5);
    const lab = rgbToLab(mixed);
    expect(lab.b).toBeLessThan(-10);
    expect(mixed[2]).toBeGreaterThan(mixed[0]);
  });

  it("returns a pigment unchanged when mixed with itself", () => {
    const blended = engine.mix([
      { rgb: BLUE, weight: 0.4 },
      { rgb: BLUE, weight: 0.6 },
    ]);
    expect(deltaE(blended, BLUE)).toBeLessThan(2);
  });

  it("approaches each endpoint as the blend factor reaches 0 and 1", () => {
    expect(deltaE(lerpMix(engine, BLUE, YELLOW, 0), BLUE)).toBeLessThan(2);
    expect(deltaE(lerpMix(engine, BLUE, YELLOW, 1), YELLOW)).toBeLessThan(2);
  });

  it("ignores components with zero weight", () => {
    const withZero = engine.mix([
      { rgb: BLUE, weight: 1 },
      { rgb: YELLOW, weight: 0 },
    ]);
    expect(deltaE(withZero, BLUE)).toBeLessThan(2);
  });

  it("handles an empty mix and a single component", () => {
    expect(engine.mix([])).toEqual([0, 0, 0]);
    expect(
      deltaE(engine.mix([{ rgb: YELLOW, weight: 1 }]), YELLOW)
    ).toBeLessThan(2);
  });

  it("falls back to the first component when all weights are zero", () => {
    expect(
      engine.mix([
        { rgb: BLUE, weight: 0 },
        { rgb: YELLOW, weight: 0 },
      ])
    ).toEqual(BLUE);
  });
});

describe("SpectralEngine — tinting strength", () => {
  const engine = new SpectralEngine();

  it("lets a stronger pigment dominate an equal-weight mix", () => {
    const weak = engine.mix([
      { rgb: WHITE, weight: 0.5 },
      { rgb: PHTHALO, weight: 0.5, tintingStrength: 0.2 },
    ]);
    const strong = engine.mix([
      { rgb: WHITE, weight: 0.5 },
      { rgb: PHTHALO, weight: 0.5, tintingStrength: 2 },
    ]);
    // Stronger phthalo pulls the 50/50 mix further from white (darker, bluer).
    expect(deltaE(strong, WHITE)).toBeGreaterThan(deltaE(weak, WHITE));
  });
});

describe("MixboxEngine — folds tinting strength into weight", () => {
  const engine = new MixboxEngine();

  it("treats strength as a weight multiplier", () => {
    const viaStrength = engine.mix([
      { rgb: BLUE, weight: 1, tintingStrength: 3 },
      { rgb: YELLOW, weight: 1 },
    ]);
    const viaWeight: Rgb = engine.mix([
      { rgb: BLUE, weight: 3 },
      { rgb: YELLOW, weight: 1 },
    ]);
    expect(deltaE(viaStrength, viaWeight)).toBeLessThan(0.5);
  });
});
