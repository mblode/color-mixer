declare module "mixbox" {
  type RgbInput = [number, number, number] | string;

  export interface MixboxAPI {
    /** Number of meaningful latent components (7: 4 concentrations + 3 residual). */
    readonly LATENT_SIZE: number;
    lerp(
      color1: RgbInput,
      color2: RgbInput,
      t: number
    ): [number, number, number];
    /** Encode an sRGB colour (0–255 channels or hex) into the 7-D latent space. */
    rgbToLatent(color: RgbInput): number[];
    /** Decode a latent vector back to sRGB channels (0–255). */
    latentToRgb(latent: number[]): [number, number, number];
  }

  const mixbox: MixboxAPI;
  export default mixbox;
}
