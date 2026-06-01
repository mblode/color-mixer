import { describe, expect, it } from "vitest";

import { ciede2000, deltaE, type Lab, rgbToLab } from "./delta-e";

// Reference pairs from Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-
// Difference Formula", Table 1 — the canonical implementation test vectors.
const SHARMA_CASES: Array<{ a: Lab; b: Lab; expected: number }> = [
  {
    a: { L: 50, a: 2.6772, b: -79.7751 },
    b: { L: 50, a: 0, b: -82.7485 },
    expected: 2.0425,
  },
  {
    a: { L: 50, a: 3.1571, b: -77.2803 },
    b: { L: 50, a: 0, b: -82.7485 },
    expected: 2.8615,
  },
  {
    a: { L: 50, a: -1.3802, b: -84.2814 },
    b: { L: 50, a: 0, b: -82.7485 },
    expected: 1.0,
  },
  {
    a: { L: 50, a: 0, b: 0 },
    b: { L: 50, a: -1, b: 2 },
    expected: 2.3669,
  },
  {
    a: { L: 50, a: 2.49, b: -0.001 },
    b: { L: 50, a: -2.49, b: 0.0009 },
    expected: 7.1792,
  },
  {
    a: { L: 60.2574, a: -34.0099, b: 36.2677 },
    b: { L: 60.4626, a: -34.1751, b: 39.4387 },
    expected: 1.2644,
  },
  {
    a: { L: 35.0831, a: -44.1164, b: 3.7933 },
    b: { L: 35.0232, a: -40.0716, b: 1.5901 },
    expected: 1.8645,
  },
];

describe("ciede2000", () => {
  it("matches the Sharma et al. reference vectors", () => {
    for (const { a, b, expected } of SHARMA_CASES) {
      expect(ciede2000(a, b)).toBeCloseTo(expected, 4);
    }
  });

  it("is zero for identical colours", () => {
    const lab = { L: 42, a: 12, b: -7 };
    expect(ciede2000(lab, lab)).toBe(0);
  });
});

describe("deltaE on sRGB", () => {
  it("is zero for identical sRGB colours", () => {
    expect(deltaE([0.2, 0.4, 0.6], [0.2, 0.4, 0.6])).toBe(0);
  });

  it("reports a large difference between black and white", () => {
    expect(deltaE([0, 0, 0], [1, 1, 1])).toBeGreaterThan(90);
  });

  it("converts pure white to L≈100", () => {
    expect(rgbToLab([1, 1, 1]).L).toBeCloseTo(100, 2);
  });
});
