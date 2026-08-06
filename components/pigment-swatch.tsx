import type { ReactNode } from "react";

import { needsDefinedEdge } from "../lib/color/swatch-edge";
import { cn } from "../lib/utils";

export interface PigmentSwatchProps {
  /** Rendered over the fill, filling the dab. */
  children?: ReactNode;
  hex?: string;
  isActive: boolean;
  label: string;
  /** Second tooltip line: Colour Index code and tinting strength. */
  detail?: string;
  onClick: () => void;
}

/**
 * A paint dab.
 *
 * The dab stays a whole disc in both states and selection is one ring, held off
 * the edge by a gap. Earlier versions also shrank the fill to reveal a ring of
 * the pigment's own colour, which stacked three cues and read as a dartboard:
 * black, yellow, white, yellow. The gap is what makes a single ring work for
 * every pigment, since a dark ring sits directly on phthalo blue unseen and
 * titanium white has no edge of its own to show.
 */
export function PigmentSwatch({
  children,
  detail,
  hex,
  isActive,
  label,
  onClick,
}: PigmentSwatchProps) {
  return (
    <button
      aria-label={detail ? `${label}, ${detail}` : label}
      aria-pressed={isActive}
      className={cn(
        "group relative size-10 shrink-0 rounded-full transition-shadow duration-150 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // The offset band takes the dock's colour, so the ring reads as floating
        // clear of the dab rather than outlining it.
        isActive &&
          "ring-2 ring-foreground ring-offset-2 ring-offset-background"
      )}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden rounded-full bg-card transition-transform duration-150 group-active:scale-95 motion-reduce:transition-none",
          // Only pigments too pale to hold their own edge get a hairline.
          needsDefinedEdge(hex) && "ring-1 ring-inset ring-black/20"
        )}
        style={hex ? { backgroundColor: hex } : undefined}
      >
        {children}
      </span>

      {/* CSS-only tooltip: the dock is a known container and this only ever
          opens upward, so it does not need a positioning library. */}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-foreground px-2.5 py-1.5 text-center font-medium text-[11px] text-background leading-tight group-hover:block group-focus-visible:block"
        role="tooltip"
      >
        {label}
        {detail ? (
          <span className="block font-mono text-background/70">{detail}</span>
        ) : null}
      </span>
    </button>
  );
}
