import mixbox from "mixbox";
import type { PigmentPreset } from "./pigments";

export type RGBColor = [number, number, number];
export type PigmentLatent = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface PigmentMixResult {
  rgb: RGBColor;
  hex: string;
  ratioA: number;
  ratioB: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const hexToRgb = (hex: string): RGBColor => {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) {
    throw new Error(`Unsupported hex color: ${hex}`);
  }

  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);

  return [r, g, b];
};

export const rgbToHex = ([r, g, b]: RGBColor): string => {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const mixPigmentPair = (
  pigmentA: PigmentPreset | null,
  pigmentB: PigmentPreset | null,
  ratioPercent: number
): PigmentMixResult | null => {
  if (!(pigmentA && pigmentB)) {
    return null;
  }

  const ratioA = clamp(ratioPercent, 0, 100) / 100;
  const ratioB = 1 - ratioA;

  const rgbA = hexToRgb(pigmentA.hex);
  const rgbB = hexToRgb(pigmentB.hex);

  const mixed = mixbox.lerp(rgbB, rgbA, ratioA);

  return {
    rgb: mixed,
    hex: rgbToHex(mixed),
    ratioA,
    ratioB,
  };
};

const toPigmentLatent = (latent: number[]): PigmentLatent => [
  latent[0] ?? 0,
  latent[1] ?? 0,
  latent[2] ?? 0,
  latent[3] ?? 0,
  latent[4] ?? 0,
  latent[5] ?? 0,
  latent[6] ?? 0,
  0,
];

export const hexToPigmentLatent = (hex: string): PigmentLatent =>
  toPigmentLatent(mixbox.rgbToLatent(hex));

export const ZERO_LATENT: PigmentLatent = [0, 0, 0, 0, 0, 0, 0, 0];
