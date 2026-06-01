import { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import type { PigmentPreset } from "../lib/pigments";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface PigmentControlsProps {
  palette: PigmentPreset[];
  pigment: PigmentPreset;
  customPigment: PigmentPreset;
  onSelectPigment: (pigment: PigmentPreset) => void;
  onCustomColorChange: (hex: string) => void;
}

export function PigmentControls({
  palette,
  pigment,
  customPigment,
  onSelectPigment,
  onCustomColorChange,
}: PigmentControlsProps) {
  const pigmentId = pigment?.id ?? "";
  const isCustomActive = pigmentId === customPigment.id;
  const [isCustomOpen, setIsCustomOpen] = useState(isCustomActive);

  const handleCustomChange = (next: string) => {
    onCustomColorChange(next);
    onSelectPigment(customPigment);
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-2">
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
              <button
                aria-label={
                  isCustomActive ? "Edit custom color" : "Custom color"
                }
                aria-pressed={isCustomActive}
                className={cn(
                  "group flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                  isCustomActive
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border/70 hover:border-foreground/30"
                )}
                type="button"
              >
                {isCustomActive ? (
                  <div className="relative">
                    <div
                      className="h-9 w-9 rounded-full border border-white/70 shadow-sm"
                      style={{ backgroundColor: customPigment.hex }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                      <PencilIcon />
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="h-9 w-9 rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 180deg, #fdde5c, #f8ab5c, #f56a62, #a176c8, #759beb, #65beb3, #70db96, #fdde5c)",
                      }}
                    />
                    <div className="absolute inset-1.5 rounded-full bg-card" />
                    <span className="absolute inset-0 flex items-center justify-center text-foreground">
                      <PlusIcon />
                    </span>
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72" sideOffset={12}>
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/30 p-2">
                  <HexColorPicker
                    color={customPigment.hex}
                    onChange={handleCustomChange}
                  />
                </div>
                <HexColorInput
                  aria-label="Custom pigment hex"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 font-medium text-foreground text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  color={customPigment.hex}
                  onChange={handleCustomChange}
                  placeholder="#RRGGBB"
                  prefixed
                />
              </div>
            </PopoverContent>
          </Popover>
          {palette.map((item) => {
            const isActive = item.id === pigmentId;
            return (
              <button
                aria-label={item.name}
                aria-pressed={isActive}
                className={cn(
                  "group flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                  isActive
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border/70 hover:border-foreground/30"
                )}
                key={item.id}
                onClick={() => {
                  onSelectPigment(item);
                  setIsCustomOpen(false);
                }}
                title={item.name}
                type="button"
              >
                <span
                  className="h-9 w-9 rounded-full border border-white/70 shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
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
