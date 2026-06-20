import type { BrushSettings } from "./types";

/**
 * The one tuned oil / natural-media brush. Loaded and opaque, with a
 * soft-but-defined tip, tight dab spacing for smooth strokes, and dynamics that
 * make the line taper and lighten when drawn fast — the expressive behaviour of
 * Procreate/Krita natural-media brushes.
 */
export const OIL_BRUSH: BrushSettings = {
  size: 0.06,
  spacing: 0.08,
  flow: 0.7,
  opacity: 1,
  hardness: 0.5,
  smoothing: 0.5,
  // Pressure broadens and loads the brush; with no pen it stays near full.
  pressureToSize: { atZero: 0.35, atOne: 1, gamma: 1 },
  pressureToFlow: { atZero: 0.5, atOne: 1, gamma: 1 },
  // Fast strokes thin out and lighten (dry-brush); slow strokes stay broad/rich.
  speedToSize: { atZero: 1, atOne: 0.72, gamma: 1 },
  speedToFlow: { atZero: 1, atOne: 0.85, gamma: 1 },
  scatter: 0.04,
  smudgeLength: 0.8,
  smudgeColorRate: 0.1,
};
