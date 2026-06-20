/**
 * Engine benchmark: Mixbox vs Spectral across the reference palette.
 *
 * Run with:  npx tsx lib/color/benchmark.ts
 *
 * Reports (1) how far the two engines disagree on 50/50 pigment mixes in ΔE00,
 * and (2) per-mix runtime. Output is Markdown, intended to be pasted into the
 * "Engine benchmark" section of docs/colour-mixing-audit.md.
 */

import { pigmentPalette } from "../pigments";
import { deltaE } from "./delta-e";
import type { MixEngine, PaintComponent } from "./mix-engine";
import { MixboxEngine } from "./mixbox-engine";
import { SpectralEngine } from "./spectral-engine";
import { hexToRgb } from "./srgb";

interface NamedPigment {
  name: string;
  component: Omit<PaintComponent, "weight">;
}

const pigments: NamedPigment[] = pigmentPalette.map((pigment) => ({
  name: pigment.name,
  component: {
    rgb: hexToRgb(pigment.hex),
    tintingStrength: pigment.tintingStrength,
  },
}));

const mixbox = new MixboxEngine();
const spectral = new SpectralEngine();

const fiftyFifty = (
  engine: MixEngine,
  a: NamedPigment,
  b: NamedPigment
): readonly [number, number, number] =>
  engine.mix([
    { ...a.component, weight: 0.5 },
    { ...b.component, weight: 0.5 },
  ]);

interface PairResult {
  a: string;
  b: string;
  deltaBetweenEngines: number;
}

const results: PairResult[] = [];
for (let i = 0; i < pigments.length; i++) {
  for (let j = i + 1; j < pigments.length; j++) {
    const a = pigments[i];
    const b = pigments[j];
    results.push({
      a: a.name,
      b: b.name,
      deltaBetweenEngines: deltaE(
        fiftyFifty(mixbox, a, b),
        fiftyFifty(spectral, a, b)
      ),
    });
  }
}

const deltas = results.map((r) => r.deltaBetweenEngines);
const mean = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
const max = Math.max(...deltas);
const median = [...deltas].sort((x, y) => x - y)[Math.floor(deltas.length / 2)];

const timeEngine = (engine: MixEngine): number => {
  const iterations = 20_000;
  const a = pigments[0];
  const b = pigments[6];
  const start = performance.now();
  for (let n = 0; n < iterations; n++) {
    fiftyFifty(engine, a, b);
  }
  return ((performance.now() - start) / iterations) * 1000; // µs per mix
};

// Warm up lazy memoisation before timing.
timeEngine(mixbox);
timeEngine(spectral);
const mixboxUs = timeEngine(mixbox);
const spectralUs = timeEngine(spectral);

const topDivergent = [...results]
  .sort((x, y) => y.deltaBetweenEngines - x.deltaBetweenEngines)
  .slice(0, 5);

const fmt = (n: number): string => n.toFixed(2);

console.log(`### Engine agreement (50/50 mixes, ${results.length} pairs)

| Metric | ΔE00 (Mixbox vs Spectral) |
| --- | --- |
| Mean | ${fmt(mean)} |
| Median | ${fmt(median)} |
| Max | ${fmt(max)} |

Most divergent pairs:

| Pigment A | Pigment B | ΔE00 |
| --- | --- | --- |
${topDivergent.map((r) => `| ${r.a} | ${r.b} | ${fmt(r.deltaBetweenEngines)} |`).join("\n")}

### Runtime (per 2-pigment mix)

| Engine | µs/mix |
| --- | --- |
| Mixbox | ${fmt(mixboxUs)} |
| Spectral | ${fmt(spectralUs)} |
`);
