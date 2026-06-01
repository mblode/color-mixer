/**
 * MixboxEngine — pigment mixing via the Mixbox latent space (Sochorová &
 * Jamriška, "Practical Pigment Mixing for Digital Painting", SIGGRAPH Asia
 * 2021). Used as the fidelity reference in the engine benchmark.
 *
 * Mixing is the officially-sanctioned N-colour weighted average of latent
 * vectors: `latentToRgb(Σ wᵢ·rgbToLatent(rgbᵢ) / Σ wᵢ)`. Mixbox has no native
 * tinting-strength concept, so we fold it into the weights (`wᵢ·Tᵢ`) to keep
 * the comparison with the spectral engine fair.
 *
 * Note: Mixbox is CC BY-NC licensed (non-commercial). See finding F9.
 */

import mixbox from "mixbox";

import {
  type MixEngine,
  type PaintComponent,
  tintingStrengthOf,
} from "./mix-engine";
import { bytesToRgb, type Rgb, rgbToBytes } from "./srgb";

export class MixboxEngine implements MixEngine {
  readonly id = "mixbox";
  readonly label = "Mixbox (latent, CC BY-NC)";

  mix(components: PaintComponent[]): Rgb {
    if (components.length === 0) {
      return [0, 0, 0];
    }

    const latentSize = mixbox.LATENT_SIZE;
    const accumulated = Array.from({ length: latentSize }, () => 0);
    let totalWeight = 0;

    for (const component of components) {
      const weight = component.weight * tintingStrengthOf(component);
      if (weight <= 0) {
        continue;
      }
      const latent = mixbox.rgbToLatent(rgbToBytes(component.rgb));
      for (let i = 0; i < latentSize; i++) {
        accumulated[i] += (latent[i] ?? 0) * weight;
      }
      totalWeight += weight;
    }

    if (totalWeight <= 0) {
      return components[0].rgb;
    }

    for (let i = 0; i < latentSize; i++) {
      accumulated[i] /= totalWeight;
    }

    return bytesToRgb(mixbox.latentToRgb(accumulated));
  }
}
