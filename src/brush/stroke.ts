import { OneEuroFilter, OneEuroPoint } from "./one-euro";
import {
  type BrushSettings,
  type Dab,
  evalCurve,
  type StrokeSample,
} from "./types";

const MIN_DAB_RADIUS = 0.5;
const MIN_DT_SECONDS = 1 / 1000;
const SMOOTH_MAX_CUTOFF = 8;
const SMOOTH_MIN_CUTOFF = 0.5;
const SMOOTH_BETA = 0.015;

/** Deterministic PRNG (mulberry32) so scatter is reproducible per stroke. */
const makeRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d_2b_79_f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export interface StrokeConfig {
  settings: BrushSettings;
  /** Smaller canvas dimension in pixels — converts size fractions to pixels. */
  minDimension: number;
  /** Speed (px/s) at which speed-driven dynamics reach full effect. */
  referenceSpeed?: number;
  /** Seed for deterministic scatter (tests pass a fixed value). */
  seed?: number;
}

/**
 * Converts a series of pointer samples into evenly-spaced brush dabs.
 *
 * Mirrors the MyPaint/Krita model: smooth the input (1€ filter), then walk the
 * path by arc length emitting a dab every `spacing × diameter`, carrying the
 * leftover sub-dab distance between samples so density is independent of cursor
 * speed and frame rate. Per-dab size/flow follow pressure and speed dynamics.
 */
export class Stroke {
  private readonly settings: BrushSettings;
  private readonly baseRadius: number;
  private readonly referenceSpeed: number;
  private readonly point: OneEuroPoint;
  private readonly pressureFilter: OneEuroFilter;
  private readonly rng: () => number;

  private active = false;
  private lastX = 0;
  private lastY = 0;
  private lastPressure = 0;
  private lastTime = 0;
  private distanceSinceDab = 0;
  private nextStep = 1;
  private direction = { x: 1, y: 0 };

  constructor(config: StrokeConfig) {
    this.settings = config.settings;
    this.baseRadius = (config.settings.size * config.minDimension) / 2;
    this.referenceSpeed = config.referenceSpeed ?? config.minDimension * 2.5;
    const minCutoff =
      SMOOTH_MAX_CUTOFF +
      (SMOOTH_MIN_CUTOFF - SMOOTH_MAX_CUTOFF) * config.settings.smoothing;
    const options = { minCutoff, beta: SMOOTH_BETA, dCutoff: 1 };
    this.point = new OneEuroPoint(options);
    this.pressureFilter = new OneEuroFilter(options);
    this.rng = makeRng(config.seed ?? 1);
  }

  /** Begin a stroke; returns the initial dab at the first point. */
  begin(sample: StrokeSample): Dab[] {
    this.active = true;
    const filtered = this.point.filter(sample.x, sample.y, 0);
    const pressure = this.pressureFilter.filter(sample.pressure, 0);
    this.lastX = filtered.x;
    this.lastY = filtered.y;
    this.lastPressure = pressure;
    this.lastTime = sample.time;
    this.distanceSinceDab = 0;
    const dab = this.makeDab(filtered.x, filtered.y, pressure, 0);
    this.nextStep = this.stepFor(dab.radius);
    return [dab];
  }

  /** Extend the stroke with a new sample; returns any dabs emitted. */
  extend(sample: StrokeSample): Dab[] {
    if (!this.active) {
      return this.begin(sample);
    }
    const dt = Math.max(MIN_DT_SECONDS, (sample.time - this.lastTime) / 1000);
    const filtered = this.point.filter(sample.x, sample.y, dt);
    const pressure = this.pressureFilter.filter(sample.pressure, dt);

    const ax = this.lastX;
    const ay = this.lastY;
    const dx = filtered.x - ax;
    const dy = filtered.y - ay;
    const segLength = Math.hypot(dx, dy);

    const dabs: Dab[] = [];
    if (segLength > 1e-4) {
      const dirX = dx / segLength;
      const dirY = dy / segLength;
      this.direction = { x: dirX, y: dirY };
      const speed = segLength / dt;
      const speedN = Math.min(1, speed / this.referenceSpeed);

      let traveled = 0;
      while (this.distanceSinceDab + (segLength - traveled) >= this.nextStep) {
        const advance = this.nextStep - this.distanceSinceDab;
        traveled += advance;
        const f = traveled / segLength;
        const px = ax + dirX * traveled;
        const py = ay + dirY * traveled;
        const dabPressure =
          this.lastPressure + (pressure - this.lastPressure) * f;
        const dab = this.makeDab(px, py, dabPressure, speedN);
        dabs.push(dab);
        this.distanceSinceDab = 0;
        this.nextStep = this.stepFor(dab.radius);
      }
      this.distanceSinceDab += segLength - traveled;
    }

    this.lastX = filtered.x;
    this.lastY = filtered.y;
    this.lastPressure = pressure;
    this.lastTime = sample.time;
    return dabs;
  }

  /** End the stroke. Returns no dabs; resets internal state. */
  end(): Dab[] {
    this.active = false;
    this.point.reset();
    this.pressureFilter.reset();
    this.distanceSinceDab = 0;
    return [];
  }

  get isActive(): boolean {
    return this.active;
  }

  private stepFor(radius: number): number {
    // Spacing is a fraction of diameter; clamp so a step is never degenerate.
    return Math.max(0.5, this.settings.spacing * radius * 2);
  }

  private makeDab(x: number, y: number, pressure: number, speedN: number): Dab {
    const sizeMul =
      evalCurve(this.settings.pressureToSize, pressure) *
      evalCurve(this.settings.speedToSize, speedN);
    const flowMul =
      evalCurve(this.settings.pressureToFlow, pressure) *
      evalCurve(this.settings.speedToFlow, speedN);
    const radius = Math.max(MIN_DAB_RADIUS, this.baseRadius * sizeMul);
    const flow = Math.min(1, Math.max(0, this.settings.flow * flowMul));
    const angle = Math.atan2(this.direction.y, this.direction.x);

    const scatter = this.settings.scatter * radius;
    const jitterX = scatter > 0 ? (this.rng() * 2 - 1) * scatter : 0;
    const jitterY = scatter > 0 ? (this.rng() * 2 - 1) * scatter : 0;

    return { x: x + jitterX, y: y + jitterY, radius, flow, angle };
  }
}
