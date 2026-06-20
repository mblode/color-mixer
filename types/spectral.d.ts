declare module "spectral.js" {
  export interface ToStringOptions {
    format?: "hex" | "rgb";
    method?: "map" | "clip";
  }

  /**
   * A pigment colour with its spectral reflectance and Kubelka-Munk
   * parameters. Construct from a hex/CSS string or sRGB array.
   */
  export class Color {
    constructor(color: string | number[]);
    /** Reflectance curve, 380–750 nm in 10 nm steps. */
    readonly R: number[];
    /** sRGB representation (0–1). */
    readonly sRGB: number[];
    /** Linear-light RGB representation (0–1). */
    readonly lRGB: number[];
    /** CIE XYZ representation. */
    readonly XYZ: number[];
    readonly OKLab: number[];
    readonly OKLCh: number[];
    /** Kubelka-Munk absorption/scattering parameters per wavelength. */
    readonly KS: number[];
    readonly luminance: number;
    /** Pigment dominance in a mix (default 1). */
    tintingStrength: number;
    inGamut(options?: { epsilon?: number }): boolean;
    toGamut(options?: { method?: "map" | "clip" }): Color;
    toString(options?: ToStringOptions): string;
  }

  /** Mix weighted pigments: `mix([colorA, wA], [colorB, wB], ...)`. */
  export function mix(...colors: [Color, number][]): Color;
  export function palette(a: Color, b: Color, size: number): Color[];
  export function gradient(a: Color, b: Color, size: number): Color[];

  const spectral: {
    Color: typeof Color;
    mix: typeof mix;
    palette: typeof palette;
    gradient: typeof gradient;
  };
  export default spectral;
}
