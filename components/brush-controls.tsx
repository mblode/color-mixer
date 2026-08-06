import type { ChangeEvent, CSSProperties } from "react";

import type { Tool } from "../brush/types";
import { cn } from "../lib/utils";

export interface BrushControlsProps {
  radius: number;
  flow: number;
  tool: Tool;
  /** Drives the slider fills, so the controls carry the current pigment. */
  pigmentHex: string;
  onRadiusChange: (value: number) => void;
  onFlowChange: (value: number) => void;
  onToolChange: (tool: Tool) => void;
}

const MIN_BRUSH_RADIUS = 0.02;
const MAX_BRUSH_RADIUS = 0.14;
const MIN_FLOW = 0.15;
const MAX_FLOW = 1;

const normalize = (value: number, min: number, max: number) =>
  (Math.min(Math.max(value, min), max) - min) / (max - min);

export function BrushControls({
  radius,
  flow,
  tool,
  pigmentHex,
  onRadiusChange,
  onFlowChange,
  onToolChange,
}: BrushControlsProps) {
  const handleRadiusChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRadiusChange(Number(event.target.value));
  };

  const handleFlowChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFlowChange(Number(event.target.value));
  };

  // The dot inside the thumb is the brush preview, so it has to stay legible at
  // the bottom of the range rather than shrinking to nothing.
  const sizeDot = 4 + normalize(radius, MIN_BRUSH_RADIUS, MAX_BRUSH_RADIUS) * 6;

  return (
    <div className="flex items-center gap-4">
      <div className="grid gap-2">
        <Slider
          // Plain track: the dot's diameter is what carries the value here, so a
          // gradient would only add a second signal that means nothing.
          dot={sizeDot}
          fill="hsl(var(--muted))"
          label="Brush size"
          max={MAX_BRUSH_RADIUS}
          min={MIN_BRUSH_RADIUS}
          onChange={handleRadiusChange}
          step={0.005}
          thumbColor={pigmentHex}
          value={radius}
        />
        <Slider
          // Flow is opacity, so the track shows the pigment arriving.
          fill={`linear-gradient(to right, hsl(var(--muted)), ${pigmentHex})`}
          label="Flow"
          max={MAX_FLOW}
          min={MIN_FLOW}
          onChange={handleFlowChange}
          step={0.05}
          thumbColor={pigmentHex}
          value={flow}
        />
      </div>
      <ToolPicker onToolChange={onToolChange} tool={tool} />
    </div>
  );
}

interface SliderProps {
  /** Radius of the coloured disc inside the thumb, in px. */
  dot?: number;
  fill: string;
  label: string;
  max: number;
  min: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  step: number;
  thumbColor: string;
  value: number;
}

function Slider({
  dot,
  fill,
  label,
  max,
  min,
  onChange,
  step,
  thumbColor,
  value,
}: SliderProps) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-[68px] shrink-0 font-medium text-foreground text-xs">
        {label}
      </span>
      {/* No numeric readout: the thumb's dot shows the size and the track shows
          the flow, so a percentage would only repeat them less clearly. */}
      <input
        className="range w-32 sm:w-40"
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        style={
          {
            "--range-fill": fill,
            "--range-thumb": thumbColor,
            ...(dot === undefined ? {} : { "--range-dot": `${dot}px` }),
          } as CSSProperties
        }
        type="range"
        value={value}
      />
    </label>
  );
}

const TOOLS: { id: Tool; label: string }[] = [
  { id: "paint", label: "Paint" },
  { id: "smudge", label: "Smudge" },
];

interface ToolPickerProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
}

function ToolPicker({ tool, onToolChange }: ToolPickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Tool</legend>
      {/* Stacked on desktop so it reads as two rows alongside the swatch grid;
          side by side on mobile, where dock height is the scarce thing. */}
      <div className="flex flex-row gap-1 rounded-control bg-muted p-1 ring-1 ring-inset ring-black/[0.06] sm:flex-col">
        {TOOLS.map((entry) => (
          <button
            aria-pressed={tool === entry.id}
            className={cn(
              "rounded-[calc(var(--radius-control)-0.25rem)] px-3 py-1 font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tool === entry.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={entry.id}
            onClick={() => onToolChange(entry.id)}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
