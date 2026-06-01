/**
 * 1€ filter — speed-adaptive low-pass smoothing for pointer input.
 *
 * Casiez, Roussel & Vogel, "1€ Filter: A Simple Speed-based Low-pass Filter for
 * Noisy Input in Interactive Systems" (CHI 2012). The cutoff frequency rises
 * with movement speed, so it removes jitter when the cursor is slow (where jitter
 * is most visible) and removes lag when the cursor is fast (where lag is most
 * visible) — the behaviour that makes pro brush strokes feel crisp yet smooth.
 */

const smoothingAlpha = (cutoff: number, dt: number): number => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
};

/** A first-order exponential low-pass with remembered previous output. */
class LowPass {
  private hasPrev = false;
  private prev = 0;

  filter(value: number, alpha: number): number {
    const result = this.hasPrev
      ? alpha * value + (1 - alpha) * this.prev
      : value;
    this.hasPrev = true;
    this.prev = result;
    return result;
  }

  get previous(): number {
    return this.prev;
  }

  get initialised(): boolean {
    return this.hasPrev;
  }

  reset(): void {
    this.hasPrev = false;
    this.prev = 0;
  }
}

export interface OneEuroOptions {
  /** Minimum cutoff frequency (Hz). Lower → less jitter at low speed. */
  minCutoff?: number;
  /** Speed coefficient. Higher → less lag at high speed. */
  beta?: number;
  /** Cutoff used to smooth the derivative estimate (Hz). */
  dCutoff?: number;
}

const DEFAULT_MIN_CUTOFF = 1;
const DEFAULT_BETA = 0.02;
const DEFAULT_D_CUTOFF = 1;

/** Smooths a single scalar signal sampled at irregular intervals. */
export class OneEuroFilter {
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;
  private readonly value = new LowPass();
  private readonly derivative = new LowPass();

  constructor(options: OneEuroOptions = {}) {
    this.minCutoff = options.minCutoff ?? DEFAULT_MIN_CUTOFF;
    this.beta = options.beta ?? DEFAULT_BETA;
    this.dCutoff = options.dCutoff ?? DEFAULT_D_CUTOFF;
  }

  /** Filter `value` given the elapsed time `dt` (seconds) since the last sample. */
  filter(value: number, dt: number): number {
    const safeDt = dt > 0 ? dt : 1 / 60;
    const rawDerivative = this.value.initialised
      ? (value - this.value.previous) / safeDt
      : 0;
    const edx = this.derivative.filter(
      rawDerivative,
      smoothingAlpha(this.dCutoff, safeDt)
    );
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.value.filter(value, smoothingAlpha(cutoff, safeDt));
  }

  reset(): void {
    this.value.reset();
    this.derivative.reset();
  }
}

/** Convenience wrapper smoothing a 2-D point with a shared configuration. */
export class OneEuroPoint {
  private readonly x: OneEuroFilter;
  private readonly y: OneEuroFilter;

  constructor(options: OneEuroOptions = {}) {
    this.x = new OneEuroFilter(options);
    this.y = new OneEuroFilter(options);
  }

  filter(x: number, y: number, dt: number): { x: number; y: number } {
    return { x: this.x.filter(x, dt), y: this.y.filter(y, dt) };
  }

  reset(): void {
    this.x.reset();
    this.y.reset();
  }
}
