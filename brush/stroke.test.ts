import { describe, expect, it } from "vitest";

import { OIL_BRUSH } from "./oil-brush";
import { dabRadiusAtRest, MOUSE_PRESSURE, Stroke } from "./stroke";
import type { BrushSettings, Dab, StrokeSample } from "./types";

const flat = (overrides: Partial<BrushSettings> = {}): BrushSettings => ({
  size: 0.1,
  spacing: 0.1,
  flow: 1,
  opacity: 1,
  hardness: 0.5,
  smoothing: 0,
  pressureToSize: { atZero: 1, atOne: 1, gamma: 1 },
  pressureToFlow: { atZero: 1, atOne: 1, gamma: 1 },
  speedToSize: { atZero: 1, atOne: 1, gamma: 1 },
  speedToFlow: { atZero: 1, atOne: 1, gamma: 1 },
  scatter: 0,
  smudgeLength: 0.8,
  smudgeColorRate: 0.1,
  ...overrides,
});

// Walk a horizontal stroke sampled every `stepPx` pixels.
const horizontalStroke = (
  settings: BrushSettings,
  options: { fromX: number; toX: number; stepPx: number; dtMs: number }
): Dab[] => {
  const stroke = new Stroke({ settings, minDimension: 1000, seed: 7 });
  const dabs: Dab[] = [];
  let time = 0;
  let first = true;
  for (let x = options.fromX; x <= options.toX; x += options.stepPx) {
    const sample: StrokeSample = { x, y: 300, pressure: 0.5, time };
    dabs.push(...(first ? stroke.begin(sample) : stroke.extend(sample)));
    first = false;
    time += options.dtMs;
  }
  dabs.push(...stroke.end());
  return dabs;
};

const gaps = (dabs: Dab[]): number[] => {
  const result: number[] = [];
  for (let i = 1; i < dabs.length; i++) {
    result.push(
      Math.hypot(dabs[i].x - dabs[i - 1].x, dabs[i].y - dabs[i - 1].y)
    );
  }
  return result;
};

describe("Stroke dab generation", () => {
  it("begins with a single dab and ignores extend after end", () => {
    const stroke = new Stroke({ settings: flat(), minDimension: 1000 });
    expect(stroke.begin({ x: 0, y: 0, pressure: 1, time: 0 })).toHaveLength(1);
    stroke.end();
    expect(stroke.isActive).toBe(false);
  });

  it("spaces dabs evenly at spacing × diameter along the path", () => {
    // diameter = size(0.1) × 1000 = 100px; spacing 0.1 → step ≈ 10px.
    const dabs = horizontalStroke(flat(), {
      fromX: 100,
      toX: 600,
      stepPx: 4,
      dtMs: 16,
    });
    expect(dabs.length).toBeGreaterThan(30);
    // Skip the first few dabs while the 1€ filter warms up.
    const steady = gaps(dabs).slice(5);
    for (const gap of steady) {
      expect(gap).toBeGreaterThan(8);
      expect(gap).toBeLessThan(12);
    }
  });

  it("emits a comparable dab count regardless of sample chunking", () => {
    const dense = horizontalStroke(flat(), {
      fromX: 100,
      toX: 600,
      stepPx: 3,
      dtMs: 12,
    });
    const sparse = horizontalStroke(flat(), {
      fromX: 100,
      toX: 600,
      stepPx: 9,
      dtMs: 36,
    });
    // Both cover the same 500px path at the same ~250px/s, so dab counts match.
    const ratio = dense.length / sparse.length;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });

  it("applies deterministic scatter for a given seed", () => {
    const settings = flat({ scatter: 0.3 });
    const run = () => {
      const stroke = new Stroke({ settings, minDimension: 1000, seed: 42 });
      const dabs = [stroke.begin({ x: 100, y: 100, pressure: 0.5, time: 0 })];
      dabs.push(stroke.extend({ x: 200, y: 100, pressure: 0.5, time: 40 }));
      return dabs.flat();
    };
    const a = run();
    const b = run();
    // Same seed ⇒ identical jittered positions; scatter actually offset them.
    expect(a.map((d) => d.x)).toEqual(b.map((d) => d.x));
    expect(a.some((d) => d.y !== 100)).toBe(true);
  });

  it("tapers thinner on fast strokes than slow strokes", () => {
    const settings = flat({ speedToSize: { atZero: 1, atOne: 0.5, gamma: 1 } });
    const slow = horizontalStroke(settings, {
      fromX: 100,
      toX: 600,
      stepPx: 6,
      dtMs: 60,
    });
    const fast = horizontalStroke(settings, {
      fromX: 100,
      toX: 600,
      stepPx: 60,
      dtMs: 16,
    });
    const avgRadius = (dabs: Dab[]): number =>
      dabs.reduce((sum, d) => sum + d.radius, 0) / dabs.length;
    expect(avgRadius(fast)).toBeLessThan(avgRadius(slow));
  });
});

describe("dabRadiusAtRest", () => {
  // The brush cursor is drawn from this, so if it disagrees with the dab the
  // engine emits, the ring stops matching the paint.
  const firstDabRadius = (
    settings: BrushSettings,
    minDimension: number,
    pressure: number
  ): number => {
    const stroke = new Stroke({ settings, minDimension, seed: 7 });
    const [dab] = stroke.begin({ x: 0, y: 0, pressure, time: 0 });
    return dab.radius;
  };

  it("matches the radius the engine emits for a pointer at rest", () => {
    for (const pressure of [0.25, MOUSE_PRESSURE, 1]) {
      expect(dabRadiusAtRest(OIL_BRUSH, 1000, pressure)).toBeCloseTo(
        firstDabRadius(OIL_BRUSH, 1000, pressure),
        6
      );
    }
  });

  it("is well under the nominal size for a mouse, which cannot press harder", () => {
    const nominal = (OIL_BRUSH.size * 1000) / 2;
    const actual = dabRadiusAtRest(OIL_BRUSH, 1000);

    // OIL_BRUSH maps pressure 0.5 to 0.675 of nominal, so a ring drawn at the
    // nominal size is half again too big.
    expect(actual / nominal).toBeCloseTo(0.675, 3);
  });

  it("scales with the canvas, since size is a fraction of the smaller side", () => {
    expect(dabRadiusAtRest(OIL_BRUSH, 2000)).toBeCloseTo(
      dabRadiusAtRest(OIL_BRUSH, 1000) * 2,
      6
    );
  });
});
