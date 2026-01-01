import { describe, expect, it } from "vitest";
import {
  DEFAULT_PIGMENT_SELECTION,
  otherSlot,
  pigmentPalette,
  pigmentSlots,
} from "./pigments";

describe("pigmentPalette", () => {
  it("keeps ids unique and fields well-formed", () => {
    const ids = pigmentPalette.map((pigment) => pigment.id);
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const families = new Set(["primary", "earth", "neutral"]);
    const temperatures = new Set(["warm", "cool", "neutral"]);

    expect(new Set(ids).size).toBe(ids.length);

    for (const pigment of pigmentPalette) {
      expect(pigment.name).toBeTruthy();
      expect(pigment.description).toBeTruthy();
      expect(hexPattern.test(pigment.hex)).toBe(true);
      expect(families.has(pigment.family)).toBe(true);
      expect(temperatures.has(pigment.temperature)).toBe(true);
    }
  });
});

describe("pigment slots", () => {
  it("defines the A/B slots and flips them", () => {
    expect(pigmentSlots).toEqual(["A", "B"]);
    expect(otherSlot("A")).toBe("B");
    expect(otherSlot("B")).toBe("A");
  });
});

describe("DEFAULT_PIGMENT_SELECTION", () => {
  it("references palette entries and keeps slots distinct", () => {
    const paletteIds = new Set(pigmentPalette.map((pigment) => pigment.id));
    const selectionA = DEFAULT_PIGMENT_SELECTION.A;
    const selectionB = DEFAULT_PIGMENT_SELECTION.B;

    expect(selectionA).not.toBeNull();
    expect(selectionB).not.toBeNull();
    expect(paletteIds.has(selectionA?.id ?? "")).toBe(true);
    expect(paletteIds.has(selectionB?.id ?? "")).toBe(true);
    expect(selectionA?.id).not.toBe(selectionB?.id);
  });
});
