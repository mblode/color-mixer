import { describe, expect, it } from "vitest";

import { pigmentPalette } from "../pigments";
import { needsDefinedEdge } from "./swatch-edge";

describe("needsDefinedEdge", () => {
  it("draws an edge only for the pigments that cannot hold one themselves", () => {
    const needing = pigmentPalette
      .filter((pigment) => needsDefinedEdge(pigment.hex))
      .map((pigment) => pigment.name);

    // Both yellows sit near white in luminance despite being strong hues, which
    // is exactly what a lightness cutoff would have got wrong.
    expect(needing).toEqual([
      "Cadmium Yellow",
      "Hansa Yellow",
      "Titanium White",
    ]);
  });

  it("leaves most of the palette unringed", () => {
    const unringed = pigmentPalette
      .filter((pigment) => !needsDefinedEdge(pigment.hex))
      .map((pigment) => pigment.name);

    expect(unringed.length).toBe(pigmentPalette.length - 3);
    // The blues, greens, reds and browns all define their own edge.
    expect(unringed).toContain("Phthalo Blue");
    expect(unringed).toContain("Phthalo Green");
    expect(unringed).toContain("Cadmium Red");
    expect(unringed).toContain("Burnt Sienna");
  });

  it("treats the colour wheel state and a half-typed hex conservatively", () => {
    // No hex yet: the wheel is multicoloured and needs no help.
    expect(needsDefinedEdge(undefined)).toBe(false);
    // Mid-typing in the hex field must not throw.
    expect(needsDefinedEdge("#F")).toBe(true);
    expect(needsDefinedEdge("not a colour")).toBe(true);
  });

  it("accepts shorthand hex", () => {
    expect(needsDefinedEdge("#FFF")).toBe(true);
    expect(needsDefinedEdge("#000")).toBe(false);
  });
});
