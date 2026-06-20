import mixbox from "mixbox";
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
