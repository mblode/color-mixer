import type { ReactNode } from "react";

import { cn } from "../lib/utils";

export interface PigmentSwatchProps {
  /** Rendered inside the dab. Defaults to a solid fill of `hex`. */
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
 * Unselected it reads as one solid disc. Selected, the fill shrinks inside a
 * ring of its own colour, so the selected state is a ring-plus-dot rather than
 * an added outline. The ring is the pigment itself, which is what keeps
 * titanium white legible against a white dock.
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
      className="group relative size-10 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      onClick={onClick}
      type="button"
    >
      {/* Both rings have to live in one box-shadow: a Tailwind ring-* utility is
          itself a box-shadow, so an inline one would silently replace it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-card transition-transform duration-150 group-active:scale-95"
        style={{
          boxShadow: [
            // The pigment's own ring, revealed when the fill shrinks.
            hex ? `inset 0 0 0 3px ${hex}` : null,
            // The shrinking fill alone cannot carry selection: on titanium white
            // a white ring around a white dot looks identical to an unselected
            // white disc. This dark ring is the one cue that holds for every
            // pigment, and off-state it still gives pale dabs an edge.
            isActive
              ? "0 0 0 2px hsl(var(--foreground))"
              : "0 0 0 1px rgba(15, 10, 6, 0.12)",
          ]
            .filter(Boolean)
            .join(", "),
        }}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full ring-1 ring-inset ring-black/5",
            // Asymmetric on purpose: shrinking into the selected state is
            // quick and decisive, growing back out is softer.
            isActive
              ? "scale-[0.68] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
              : "scale-100 duration-300 ease-[cubic-bezier(0.6,0,0.35,1)]",
            "transition-transform motion-reduce:transition-none"
          )}
          style={hex ? { backgroundColor: hex } : undefined}
        >
          {children}
        </span>
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
