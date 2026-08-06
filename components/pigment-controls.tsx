import { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import {
  hexToRgb,
  INK_CROSSOVER_LUMINANCE,
  relativeLuminance,
} from "../lib/color/srgb";
import type { PigmentPreset } from "../lib/pigments";
import { PigmentSwatch } from "./pigment-swatch";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface PigmentControlsProps {
  palette: PigmentPreset[];
  pigment: PigmentPreset;
  customPigment: PigmentPreset;
  onSelectPigment: (pigment: PigmentPreset) => void;
  onCustomColorChange: (hex: string) => void;
}

const PICKER_WHEEL =
  "conic-gradient(from 180deg, #fdde5c, #f8ab5c, #f56a62, #a176c8, #759beb, #65beb3, #70db96, #fdde5c)";

// The two facts a painter needs that the colour alone cannot show: which real
// tube this is, and how far it goes in a mix.
const pigmentDetail = (item: PigmentPreset) =>
  [item.colorIndex, `strength ${item.tintingStrength}`]
    .filter(Boolean)
    .join(" · ");

/**
 * Ink that stays legible on an arbitrary chosen colour. The hex arrives from a
 * text field, so a half-typed value has to fall back rather than throw.
 */
const inkOn = (hex: string) => {
  try {
    return relativeLuminance(hexToRgb(hex)) > INK_CROSSOVER_LUMINANCE
      ? "hsl(var(--foreground))"
      : "#FFFFFF";
  } catch {
    return "hsl(var(--foreground))";
  }
};

export function PigmentControls({
  palette,
  pigment,
  customPigment,
  onSelectPigment,
  onCustomColorChange,
}: PigmentControlsProps) {
  const pigmentId = pigment?.id ?? "";
  const isCustomActive = pigmentId === customPigment.id;
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handleCustomChange = (next: string) => {
    onCustomColorChange(next);
    onSelectPigment(customPigment);
  };

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Pigment</legend>
      <div className="grid grid-flow-col grid-rows-2 gap-2">
        <Popover
          onOpenChange={(nextOpen) => {
            setIsCustomOpen(nextOpen);
            if (nextOpen) {
              onSelectPigment(customPigment);
            }
          }}
          open={isCustomOpen}
        >
          <PopoverTrigger asChild>
            <div>
              <PigmentSwatch
                detail={isCustomActive ? customPigment.hex : undefined}
                // Once a colour is picked the dab behaves like any other
                // pigment: its own ring, its own shrinking fill.
                hex={isCustomActive ? customPigment.hex : undefined}
                isActive={isCustomActive}
                label={
                  isCustomActive ? "Edit custom colour" : "Pick a custom colour"
                }
                onClick={() => setIsCustomOpen(!isCustomOpen)}
              >
                {isCustomActive ? (
                  // Once the wheel is replaced by a flat colour, nothing says
                  // the dab is still editable. The pen does.
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: inkOn(customPigment.hex) }}
                  >
                    <PencilIcon />
                  </span>
                ) : (
                  // Until then it is a colour wheel with a plus through it,
                  // which reads as "choose one" rather than a muddy pigment.
                  <>
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: PICKER_WHEEL }}
                    />
                    <span className="absolute inset-[5px] rounded-full bg-card" />
                    <span className="absolute inset-0 flex items-center justify-center text-foreground">
                      <PlusIcon />
                    </span>
                  </>
                )}
              </PigmentSwatch>
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-72"
            side="top"
            sideOffset={12}
          >
            <div className="space-y-3">
              <div className="rounded-control bg-muted/40 p-2">
                <HexColorPicker
                  color={customPigment.hex}
                  onChange={handleCustomChange}
                />
              </div>
              <HexColorInput
                aria-label="Custom pigment hex"
                className="flex h-10 w-full rounded-control border border-input bg-background px-3 py-2 font-mono text-foreground text-sm uppercase transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                color={customPigment.hex}
                onChange={handleCustomChange}
                placeholder="#RRGGBB"
                prefixed
              />
            </div>
          </PopoverContent>
        </Popover>

        {palette.map((item) => (
          <PigmentSwatch
            detail={pigmentDetail(item)}
            hex={item.hex}
            isActive={item.id === pigmentId}
            key={item.id}
            label={item.name}
            onClick={() => {
              onSelectPigment(item);
              setIsCustomOpen(false);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.5 6.5 17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}
