import { describe, expect, it } from "vitest";

import { OneEuroFilter } from "./one-euro";

const variance = (values: number[]): number => {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
};

// Deterministic pseudo-noise so the test is reproducible.
const noise = (i: number): number => Math.sin(i * 12.9898) * 43_758.5453;
const fract = (x: number): number => x - Math.floor(x);

describe("OneEuroFilter", () => {
  it("passes the first sample through unchanged", () => {
    const filter = new OneEuroFilter();
    expect(filter.filter(42, 1 / 60)).toBe(42);
  });

  it("reduces jitter on a noisy stationary signal", () => {
    const filter = new OneEuroFilter({ minCutoff: 1, beta: 0 });
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 200; i++) {
      const value = (fract(noise(i)) - 0.5) * 2; // jitter around 0
      input.push(value);
      output.push(filter.filter(value, 1 / 60));
    }
    expect(variance(output)).toBeLessThan(variance(input) * 0.5);
  });

  it("tracks a steady ramp with little lag", () => {
    const filter = new OneEuroFilter({ minCutoff: 1, beta: 0.1 });
    let last = 0;
    for (let i = 0; i < 200; i++) {
      last = filter.filter(i, 1 / 60);
    }
    // After 200 steps of a unit ramp the output should be within a few units.
    expect(Math.abs(last - 199)).toBeLessThan(5);
  });

  it("resets cleanly", () => {
    const filter = new OneEuroFilter();
    filter.filter(10, 1 / 60);
    filter.reset();
    expect(filter.filter(99, 1 / 60)).toBe(99);
  });
});
