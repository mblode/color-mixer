import { contrastRatio, hexToRgb, type Rgb } from "./srgb";

/**
 * A pigment dab sits on the dock and, when selected, on the white gap inside
 * its own ring. White is the harder of the two, so it is the one to measure
 * against.
 */
const SURFACE: Rgb = [1, 1, 1];

/**
 * Below this ratio a pigment cannot define its own edge and needs a hairline.
 *
 * A lightness cutoff is the wrong test. Cadmium yellow reads as a strong colour
 * but carries only 1.2:1 of luminance contrast against white, so it needs the
 * same help titanium white does, while sap green at 3.6:1 needs none.
 */
export const EDGE_CONTRAST_FLOOR = 1.5;

/** Whether a swatch of this colour needs a drawn edge to read as a disc. */
export const needsDefinedEdge = (hex?: string): boolean => {
  if (!hex) {
    return false;
  }
  try {
    return contrastRatio(hexToRgb(hex), SURFACE) < EDGE_CONTRAST_FLOOR;
  } catch {
    // Half-typed custom hex: an edge that is not needed is cheaper than one
    // that is missing.
    return true;
  }
};
