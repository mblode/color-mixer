import type { ChangeEvent } from "react";

import type { Tool } from "../brush/types";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

export interface BrushControlsProps {
  radius: number;
  flow: number;
  tool: Tool;
  onRadiusChange: (value: number) => void;
  onFlowChange: (value: number) => void;
  onToolChange: (tool: Tool) => void;
}

const TOOLS: { id: Tool; label: string }[] = [
  { id: "paint", label: "Paint" },
  { id: "smudge", label: "Smudge" },
];

const MIN_BRUSH_RADIUS = 0.02;
const MAX_BRUSH_RADIUS = 0.14;
const MIN_FLOW = 0.15;
const MAX_FLOW = 1;
const formatPercent = (
  value: number,
  min: number,
  max: number,
  minPercent = 1,
  maxPercent = 100
) => {
  const clamped = Math.min(Math.max(value, min), max);
  const normalized = (clamped - min) / (max - min);
  return `${Math.round(minPercent + normalized * (maxPercent - minPercent))}%`;
};

export function BrushControls({
  radius,
  flow,
  tool,
  onRadiusChange,
  onFlowChange,
  onToolChange,
}: BrushControlsProps) {
  const sizePreview = Math.round(6 + radius * 160);

  const handleRadiusChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRadiusChange(Number(event.target.value));
  };

  const handleFlowChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFlowChange(Number(event.target.value));
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Brush</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted/50 p-1">
          {TOOLS.map((entry) => (
            <button
              aria-pressed={tool === entry.id}
              className={cn(
                "rounded-full px-3 py-1.5 font-medium text-sm transition-colors",
                tool === entry.id
                  ? "bg-white text-foreground shadow-sm"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brush-size">Brush size</Label>
            <span className="font-medium text-muted-foreground text-xs">
              {formatPercent(radius, MIN_BRUSH_RADIUS, MAX_BRUSH_RADIUS)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              aria-label="Brush size"
              className="range"
              id="brush-size"
              max={MAX_BRUSH_RADIUS}
              min={MIN_BRUSH_RADIUS}
              onChange={handleRadiusChange}
              step="0.005"
              type="range"
              value={radius}
            />
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white shadow-sm"
            >
              <div
                className="rounded-full bg-neutral-900"
                style={{ height: sizePreview, width: sizePreview }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brush-flow">Flow</Label>
            <span className="font-medium text-muted-foreground text-xs">
              {formatPercent(flow, MIN_FLOW, MAX_FLOW)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              aria-label="Brush flow"
              className="range"
              id="brush-flow"
              max={MAX_FLOW}
              min={MIN_FLOW}
              onChange={handleFlowChange}
              step="0.05"
              type="range"
              value={flow}
            />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white shadow-sm">
              <div
                className="h-6 w-6 rounded-full border border-neutral-300"
                style={{
                  backgroundColor: `rgba(17, 24, 39, ${Math.min(1, flow)})`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
