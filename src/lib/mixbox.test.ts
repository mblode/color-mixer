import { describe, expect, it } from "vitest";
import { hexToRgb, mixPigmentPair } from "./mixbox";
import { pigmentPalette } from "./pigments";

const getPigment = (id: string) => {
  const pigment = pigmentPalette.find((item) => item.id === id);
  if (!pigment) {
    throw new Error(`Pigment ${id} not found in palette`);
  }
  return pigment;
};

describe("hexToRgb", () => {
  it("converts hex strings to RGB tuples", () => {
    expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#1a2b3c")).toEqual([26, 43, 60]);
  });
});

describe("mixPigmentPair", () => {
  const yellow = getPigment("primary-yellow");
  const blue = getPigment("primary-blue");

  it("returns null if either pigment is missing", () => {
    expect(mixPigmentPair(yellow, null, 50)).toBeNull();
    expect(mixPigmentPair(null, blue, 50)).toBeNull();
  });

  it("returns pigment B when ratio favors it completely", () => {
    const result = mixPigmentPair(yellow, blue, 0);
    expect(result?.hex).toBe("#235CFF");
  });

  it("leans toward pigment A as the ratio increases", () => {
    const result = mixPigmentPair(yellow, blue, 100);
    expect(result?.hex).toBe("#FFE300");
  });

  it("produces a greenish tint for equal parts yellow and blue", () => {
    const result = mixPigmentPair(yellow, blue, 50);
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }
    expect(result.rgb.length).toBe(3);
    expect(result.rgb[1]).toBeGreaterThan(result.rgb[0]);
    expect(result.rgb[1]).toBeGreaterThan(result.rgb[2]);
  });
});
