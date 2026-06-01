/**
 * SpectralEngine — pigment mixing via Kubelka-Munk theory (spectral.js, MIT).
 *
 * Each pigment is upsampled to a spectral reflectance curve; mixing combines
 * the pigments' K/S in concentration-weighted fashion and inverts Kubelka-
 * Munk to a reflectance, then back to RGB. Unlike Mixbox this natively models
 * per-pigment tinting strength, and it is MIT-licensed (commercial-safe).
 *
 * This is the recommended production engine. See finding F3 (tinting strength)
 * and F9 (licensing) in the colour-mixing audit.
 */

import { Color, mix as spectralMix } from "spectral.js";
import {
  type MixEngine,
  type PaintComponent,
  tintingStrengthOf,
} from "./mix-engine";
import { bytesToRgb, type Rgb, rgbToBytes } from "./srgb";

const toColor = (component: PaintComponent): Color => {
  const color = new Color(rgbToBytes(component.rgb));
  color.tintingStrength = tintingStrengthOf(component);
  return color;
};

export class SpectralEngine implements MixEngine {
  readonly id = "spectral";
  readonly label = "Spectral (Kubelka-Munk, MIT)";

  mix(components: PaintComponent[]): Rgb {
    if (components.length === 0) {
      return [0, 0, 0];
    }

    const weighted = components.filter((component) => component.weight > 0);
    if (weighted.length === 0) {
      return components[0].rgb;
    }
    if (weighted.length === 1) {
      return weighted[0].rgb;
    }

    const pairs = weighted.map((component): [Color, number] => [
      toColor(component),
      component.weight,
    ]);
    const result = spectralMix(...pairs).toGamut();
    const [r, g, b] = result.sRGB;
    return bytesToRgb([r, g, b]);
  }
}
