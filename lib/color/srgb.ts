/**
 * sRGB ⇄ linear-light conversions and hex parsing.
 *
 * All colour mixing and alpha compositing must happen in linear light, not in
 * gamma-encoded sRGB (see the colour-mixing audit, finding F1). These helpers
 * use the exact piecewise IEC 61966-2-1 transfer function rather than a bare
 * 2.2 power, which matters near black where the two diverge.
 */

export type Rgb = readonly [number, number, number];

const SRGB_LINEAR_THRESHOLD = 0.040_45;
const LINEAR_SRGB_THRESHOLD = 0.003_130_8;
const SRGB_GAMMA = 2.4;
const SRGB_SCALE = 1.055;
const SRGB_OFFSET = 0.055;
const SRGB_SLOPE = 12.92;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Convert a single sRGB channel (0–1) to linear light (0–1). */
export const srgbChannelToLinear = (channel: number): number => {
  const c = clamp01(channel);
  return c <= SRGB_LINEAR_THRESHOLD
    ? c / SRGB_SLOPE
    : ((c + SRGB_OFFSET) / SRGB_SCALE) ** SRGB_GAMMA;
};

/** Convert a single linear-light channel (0–1) to gamma-encoded sRGB (0–1). */
export const linearChannelToSrgb = (channel: number): number => {
  const c = clamp01(channel);
  return c <= LINEAR_SRGB_THRESHOLD
    ? c * SRGB_SLOPE
    : SRGB_SCALE * c ** (1 / SRGB_GAMMA) - SRGB_OFFSET;
};

export const srgbToLinear = (rgb: Rgb): Rgb => [
  srgbChannelToLinear(rgb[0]),
  srgbChannelToLinear(rgb[1]),
  srgbChannelToLinear(rgb[2]),
];

export const linearToSrgb = (rgb: Rgb): Rgb => [
  linearChannelToSrgb(rgb[0]),
  linearChannelToSrgb(rgb[1]),
  linearChannelToSrgb(rgb[2]),
];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const BYTE_MAX = 255;
const SHORT_HEX_LENGTH = 3;
const HEX_RADIX = 16;

/** Parse a `#rgb` or `#rrggbb` hex string into sRGB channels (0–1). */
export const hexToRgb = (hex: string): Rgb => {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match) {
    throw new Error(`Invalid hex colour: "${hex}"`);
  }
  let body = match[1];
  if (body.length === SHORT_HEX_LENGTH) {
    body = body
      .split("")
      .map((channel) => channel + channel)
      .join("");
  }
  const channel = (start: number): number =>
    Number.parseInt(body.slice(start, start + 2), HEX_RADIX) / BYTE_MAX;
  return [channel(0), channel(2), channel(4)];
};

/** Format sRGB channels (0–1) as an uppercase `#rrggbb` hex string. */
export const rgbToHex = (rgb: Rgb): string => {
  const toByte = (channel: number): string =>
    Math.round(clamp01(channel) * BYTE_MAX)
      .toString(HEX_RADIX)
      .padStart(2, "0");
  return `#${toByte(rgb[0])}${toByte(rgb[1])}${toByte(rgb[2])}`.toUpperCase();
};

/** Convert sRGB channels (0–1) to 0–255 integer bytes. */
export const rgbToBytes = (rgb: Rgb): [number, number, number] => [
  Math.round(clamp01(rgb[0]) * BYTE_MAX),
  Math.round(clamp01(rgb[1]) * BYTE_MAX),
  Math.round(clamp01(rgb[2]) * BYTE_MAX),
];

/** Convert 0–255 channels back to sRGB (0–1). */
export const bytesToRgb = (bytes: readonly [number, number, number]): Rgb => [
  bytes[0] / BYTE_MAX,
  bytes[1] / BYTE_MAX,
  bytes[2] / BYTE_MAX,
];
