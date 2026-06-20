export type PigmentSlot = "A" | "B";

export type PigmentFamily = "white" | "primary" | "earth" | "neutral";
export type PigmentTemperature = "warm" | "cool" | "neutral";

export interface PigmentPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
  family: PigmentFamily;
  temperature: PigmentTemperature;
  /**
   * Colour Index Generic Name (e.g. "PB15" for phthalo blue), the standard
   * cross-manufacturer pigment identifier. `null` for non-physical presets.
   */
  colorIndex: string | null;
  /**
   * Relative tinting strength — how strongly the pigment dominates a mix.
   * Calibrated perceptually against titanium white (≈0.5): staining organics
   * such as phthalo blue (≈3) overpower weak pigments like cobalt violet
   * (≈0.6) at a fraction of the volume. Drives realistic mix ratios (see
   * finding F3 in the colour-mixing audit). Default 1 for custom pigments.
   */
  tintingStrength: number;
}

export type PigmentSelectionState = Record<PigmentSlot, PigmentPreset | null>;

/**
 * Reference artist palette. sRGB masstones are taken from the Mixbox reference
 * pigment set (scrtwpns/mixbox `shaders/mixbox.glsl`); tinting strengths are
 * perceptual estimates grounded in pigment-handling literature. These replace
 * the previous display-primary hexes, which were far more saturated than any
 * real paint (finding F6).
 */
export const pigmentPalette: PigmentPreset[] = [
  {
    id: "cadmium-yellow",
    name: "Cadmium Yellow",
    hex: "#FEEC00",
    description: "Opaque, warm yellow with moderate tinting strength.",
    family: "primary",
    temperature: "warm",
    colorIndex: "PY35",
    tintingStrength: 1,
  },
  {
    id: "hansa-yellow",
    name: "Hansa Yellow",
    hex: "#FCD300",
    description: "Transparent, staining yellow — one of Mixbox's primaries.",
    family: "primary",
    temperature: "warm",
    colorIndex: "PY3",
    tintingStrength: 1.4,
  },
  {
    id: "cadmium-red",
    name: "Cadmium Red",
    hex: "#FF2702",
    description: "Opaque, warm red that pushes clean oranges.",
    family: "primary",
    temperature: "warm",
    colorIndex: "PR108",
    tintingStrength: 1,
  },
  {
    id: "quinacridone-magenta",
    name: "Quinacridone Magenta",
    hex: "#80022E",
    description: "Transparent, very high-staining magenta primary.",
    family: "primary",
    temperature: "cool",
    colorIndex: "PR122",
    tintingStrength: 2.6,
  },
  {
    id: "ultramarine-blue",
    name: "Ultramarine Blue",
    hex: "#190059",
    description: "Warm, transparent blue that granulates into violets.",
    family: "primary",
    temperature: "warm",
    colorIndex: "PB29",
    tintingStrength: 1.2,
  },
  {
    id: "cobalt-blue",
    name: "Cobalt Blue",
    hex: "#002185",
    description: "Clean, mid-strength blue that anchors cool shadows.",
    family: "primary",
    temperature: "cool",
    colorIndex: "PB28",
    tintingStrength: 0.8,
  },
  {
    id: "phthalo-blue",
    name: "Phthalo Blue",
    hex: "#0D1B44",
    description: "Transparent, extremely strong staining blue primary.",
    family: "primary",
    temperature: "cool",
    colorIndex: "PB15",
    tintingStrength: 3,
  },
  {
    id: "phthalo-green",
    name: "Phthalo Green",
    hex: "#003C32",
    description: "Transparent, dominating green — overpowers most mixes.",
    family: "primary",
    temperature: "cool",
    colorIndex: "PG7",
    tintingStrength: 3,
  },
  {
    id: "sap-green",
    name: "Sap Green",
    hex: "#6B9404",
    description: "Warm, mid-strength green for foliage and neutrals.",
    family: "primary",
    temperature: "warm",
    colorIndex: "PG36",
    tintingStrength: 1,
  },
  {
    id: "burnt-sienna",
    name: "Burnt Sienna",
    hex: "#7B4800",
    description: "Warm transparent earth that greys complements gently.",
    family: "earth",
    temperature: "warm",
    colorIndex: "PBr7",
    tintingStrength: 0.9,
  },
  {
    id: "titanium-white",
    name: "Titanium White",
    hex: "#FFFFFF",
    description: "Opaque, weak-tinting white — lighten by adding pigment.",
    family: "white",
    temperature: "neutral",
    colorIndex: "PW6",
    tintingStrength: 0.5,
  },
];

export const DEFAULT_PIGMENT_SELECTION: PigmentSelectionState = {
  A: pigmentPalette[0],
  B: pigmentPalette[6],
};

export const pigmentSlots: PigmentSlot[] = ["A", "B"];

export const otherSlot = (slot: PigmentSlot): PigmentSlot =>
  slot === "A" ? "B" : "A";
