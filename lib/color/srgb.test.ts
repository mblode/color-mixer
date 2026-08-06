import { describe, expect, it } from "vitest";

import {
  bytesToRgb,
  hexToRgb,
  INK_CROSSOVER_LUMINANCE,
  relativeLuminance,
  linearChannelToSrgb,
  linearToSrgb,
  type Rgb,
  rgbToBytes,
  rgbToHex,
  srgbChannelToLinear,
  srgbToLinear,
} from "./srgb";

describe("hex parsing", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ff0000")).toEqual([1, 0, 0]);
  });

  it("expands 3-digit hex and tolerates missing hash/case", () => {
    expect(hexToRgb("#FFF")).toEqual([1, 1, 1]);
    expect(hexToRgb("00f")).toEqual([0, 0, 1]);
  });

  it("rejects malformed hex", () => {
    expect(() => hexToRgb("#12")).toThrow();
    expect(() => hexToRgb("nope")).toThrow();
  });

  it("round-trips through rgbToHex", () => {
    expect(rgbToHex(hexToRgb("#235CFF"))).toBe("#235CFF");
  });

  it("clamps out-of-gamut channels in rgbToHex", () => {
    expect(rgbToHex([1.5, -0.2, 0.5])).toBe("#FF0080");
  });
});

describe("byte conversion", () => {
  it("converts sRGB to 0–255 bytes, rounding and clamping", () => {
    expect(rgbToBytes([1, 0, 0.5])).toEqual([255, 0, 128]);
    expect(rgbToBytes([1.5, -0.2, 0.5])).toEqual([255, 0, 128]);
  });

  it("round-trips rgb → bytes → rgb", () => {
    const back = bytesToRgb(rgbToBytes([0.2, 0.4, 0.6]));
    for (let i = 0; i < 3; i++) {
      expect(back[i]).toBeCloseTo([0.2, 0.4, 0.6][i], 2);
    }
  });
});

describe("sRGB transfer function", () => {
  it("uses the linear segment near black", () => {
    // 0.04 / 12.92 ≈ 0.003096 — the piecewise form, not a 2.2 power.
    expect(srgbChannelToLinear(0.04)).toBeCloseTo(0.003_096, 5);
  });

  it("maps endpoints exactly", () => {
    expect(srgbChannelToLinear(0)).toBe(0);
    expect(srgbChannelToLinear(1)).toBeCloseTo(1, 10);
  });

  it("uses the linear inverse segment near black", () => {
    // Below the threshold, linear → sRGB is just × 12.92 (no power curve).
    expect(linearChannelToSrgb(0.002)).toBeCloseTo(0.002 * 12.92, 6);
  });

  it("round-trips sRGB → linear → sRGB", () => {
    const samples: Rgb[] = [
      [0.1, 0.5, 0.9],
      [0.25, 0.5, 0.75],
      [1, 0.5, 0],
    ];
    for (const sample of samples) {
      const back = linearToSrgb(srgbToLinear(sample));
      for (let i = 0; i < 3; i++) {
        expect(back[i]).toBeCloseTo(sample[i], 6);
      }
    }
  });

  it("makes a perceptual 50% considerably darker in linear light", () => {
    // sRGB 0.5 is ~0.214 of full light — the reason blending must be linear.
    expect(srgbChannelToLinear(0.5)).toBeCloseTo(0.214, 3);
  });
});

describe("relativeLuminance", () => {
  it("spans 0 to 1 between black and white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 6);
    expect(relativeLuminance([1, 1, 1])).toBeCloseTo(1, 6);
  });

  it("weights green far above blue", () => {
    const green = relativeLuminance(hexToRgb("#00FF00"));
    const blue = relativeLuminance(hexToRgb("#0000FF"));
    expect(green).toBeGreaterThan(blue * 9);
  });

  it("puts the palette's pale and dark pigments on opposite sides of the ink crossover", () => {
    // Titanium white needs dark ink, phthalo blue needs white ink.
    expect(relativeLuminance(hexToRgb("#FDFDFD"))).toBeGreaterThan(
      INK_CROSSOVER_LUMINANCE
    );
    expect(relativeLuminance(hexToRgb("#1B3A6B"))).toBeLessThan(
      INK_CROSSOVER_LUMINANCE
    );
  });

  it("crosses over where contrast against black and white is equal", () => {
    const l = INK_CROSSOVER_LUMINANCE;
    const againstWhite = 1.05 / (l + 0.05);
    const againstBlack = (l + 0.05) / 0.05;
    expect(againstWhite).toBeCloseTo(againstBlack, 2);
  });
});
