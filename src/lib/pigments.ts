export type PigmentSlot = "A" | "B";

export interface PigmentPreset {
  id: string;
  name: string;
  hex: string;
  mixboxPigment: string;
  description: string;
  family: "primary" | "earth" | "neutral";
  temperature: "warm" | "cool" | "neutral";
}

export type PigmentSelectionState = Record<PigmentSlot, PigmentPreset | null>;

export const pigmentPalette: PigmentPreset[] = [
  {
    id: "primary-yellow",
    name: "Primary Yellow",
    hex: "#FFE300",
    mixboxPigment: "primary_yellow",
    description: "Bright, sunny yellow that keeps mixes high-chroma.",
    family: "primary",
    temperature: "warm",
  },
  {
    id: "primary-red",
    name: "Primary Red",
    hex: "#FF2A2A",
    mixboxPigment: "primary_red",
    description: "Vivid red that pushes oranges and bold neutrals.",
    family: "primary",
    temperature: "warm",
  },
  {
    id: "primary-blue",
    name: "Primary Blue",
    hex: "#235CFF",
    mixboxPigment: "primary_blue",
    description: "Clean blue that anchors cool shadows and violets.",
    family: "primary",
    temperature: "cool",
  },
  {
    id: "primary-cyan",
    name: "Primary Cyan",
    hex: "#00C8FF",
    mixboxPigment: "primary_cyan",
    description: "Electric cyan that brightens greens and sky blends.",
    family: "primary",
    temperature: "cool",
  },
  {
    id: "primary-magenta",
    name: "Primary Magenta",
    hex: "#FF2DAA",
    mixboxPigment: "primary_magenta",
    description: "High-saturation magenta for punchy pinks and violets.",
    family: "primary",
    temperature: "cool",
  },
  {
    id: "primary-green",
    name: "Primary Green",
    hex: "#00C853",
    mixboxPigment: "primary_green",
    description: "Bold green for fresh mixes and clean neutrals.",
    family: "primary",
    temperature: "cool",
  },
];

export const DEFAULT_PIGMENT_SELECTION: PigmentSelectionState = {
  A: pigmentPalette[0],
  B: pigmentPalette[2],
};

export const pigmentSlots: PigmentSlot[] = ["A", "B"];

export const otherSlot = (slot: PigmentSlot): PigmentSlot =>
  slot === "A" ? "B" : "A";
