/**
 * Perceptual colour difference (CIEDE2000) for validating and benchmarking
 * mixing engines. A ΔE00 of ~1 is the just-noticeable-difference threshold.
 */

import { type Rgb, srgbToLinear } from "./srgb";

export interface Lab {
  L: number;
  a: number;
  b: number;
}

// Linear sRGB (D65) → CIE XYZ. Standard sRGB matrix.
const linearRgbToXyz = (rgb: Rgb): [number, number, number] => {
  const [r, g, b] = rgb;
  return [
    r * 0.412_456_4 + g * 0.357_576_1 + b * 0.180_437_5,
    r * 0.212_672_9 + g * 0.715_152_2 + b * 0.072_175,
    r * 0.019_333_9 + g * 0.119_192 + b * 0.950_304_1,
  ];
};

// D65 reference white.
const XN = 0.950_47;
const YN = 1;
const ZN = 1.088_83;

const DELTA = 6 / 29;
const DELTA_CUBED = DELTA ** 3;
const DELTA_SLOPE = 1 / (3 * DELTA ** 2);
const DELTA_OFFSET = 4 / 29;

const pivot = (t: number): number =>
  t > DELTA_CUBED ? Math.cbrt(t) : DELTA_SLOPE * t + DELTA_OFFSET;

/** Convert an sRGB colour (0–1) to CIELAB (D65). */
export const rgbToLab = (rgb: Rgb): Lab => {
  const [x, y, z] = linearRgbToXyz(srgbToLinear(rgb));
  const fx = pivot(x / XN);
  const fy = pivot(y / YN);
  const fz = pivot(z / ZN);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const POW7_25 = 25 ** 7;

const toDegrees = (rad: number): number => {
  const deg = rad * RAD_TO_DEG;
  return deg < 0 ? deg + 360 : deg;
};

/**
 * CIEDE2000 colour difference between two CIELAB colours.
 * Implementation follows Sharma, Wu & Dalal (2005).
 */
export const ciede2000 = (lab1: Lab, lab2: Lab): number => {
  const cBar = (Math.hypot(lab1.a, lab1.b) + Math.hypot(lab2.a, lab2.b)) / 2;
  const cBar7 = cBar ** 7;
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + POW7_25)));

  const a1p = (1 + g) * lab1.a;
  const a2p = (1 + g) * lab2.a;
  const c1p = Math.hypot(a1p, lab1.b);
  const c2p = Math.hypot(a2p, lab2.b);

  const h1p =
    a1p === 0 && lab1.b === 0 ? 0 : toDegrees(Math.atan2(lab1.b, a1p));
  const h2p =
    a2p === 0 && lab2.b === 0 ? 0 : toDegrees(Math.atan2(lab2.b, a2p));

  const deltaLp = lab2.L - lab1.L;
  const deltaCp = c2p - c1p;

  let deltahp = 0;
  if (c1p * c2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) {
      deltahp = diff;
    } else if (diff > 180) {
      deltahp = diff - 360;
    } else {
      deltahp = diff + 360;
    }
  }
  const deltaHp =
    2 * Math.sqrt(c1p * c2p) * Math.sin((deltahp * DEG_TO_RAD) / 2);

  const lBarP = (lab1.L + lab2.L) / 2;
  const cBarP = (c1p + c2p) / 2;

  let hBarP = h1p + h2p;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) {
      hBarP = h1p + h2p < 360 ? hBarP + 360 : hBarP - 360;
    }
    hBarP /= 2;
  }

  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * DEG_TO_RAD) +
    0.24 * Math.cos(2 * hBarP * DEG_TO_RAD) +
    0.32 * Math.cos((3 * hBarP + 6) * DEG_TO_RAD) -
    0.2 * Math.cos((4 * hBarP - 63) * DEG_TO_RAD);

  const deltaTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const cBarP7 = cBarP ** 7;
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + POW7_25));
  const lBarPMinus50Sq = (lBarP - 50) ** 2;
  const sl = 1 + (0.015 * lBarPMinus50Sq) / Math.sqrt(20 + lBarPMinus50Sq);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin(2 * deltaTheta * DEG_TO_RAD) * rc;

  const lTerm = deltaLp / sl;
  const cTerm = deltaCp / sc;
  const hTerm = deltaHp / sh;

  return Math.sqrt(lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rt * cTerm * hTerm);
};

/** Convenience: CIEDE2000 between two sRGB colours (0–1). */
export const deltaE = (a: Rgb, b: Rgb): number =>
  ciede2000(rgbToLab(a), rgbToLab(b));
