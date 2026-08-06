"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OIL_BRUSH } from "./brush/oil-brush";
import type { Tool } from "./brush/types";
import { BrushControls } from "./components/brush-controls";
import { CraftedBy } from "./components/crafted-by";
import { PigmentControls } from "./components/pigment-controls";
import {
  type SimulationHandle,
  SimulationCanvas,
} from "./components/simulation-canvas";
import { Button } from "./components/ui/button";
import { DEFAULT_TINTING_STRENGTH } from "./lib/color/mix-engine";
import { hexToPigmentLatent } from "./lib/mixbox";
import { type PigmentPreset, pigmentPalette } from "./lib/pigments";
import { useHotkeyLabel, useHotkeys } from "./lib/use-hotkeys";
import { cn } from "./lib/utils";
import {
  checkWebGPUCapability,
  type WebGPUCapabilityResult,
} from "./lib/webgpu";
import type { BrushInput, SimulationHistory } from "./simulation/types";

const NO_HISTORY: SimulationHistory = {
  canUndo: false,
  canRedo: false,
  depthLimit: 0,
};

const initialStatus: WebGPUCapabilityResult = {
  supported: false,
  status: "checking",
  message: "Checking for WebGPU support...",
};

const normalizeHex = (value: string) => {
  const raw = value.trim().replace("#", "");
  if (raw.length === 3) {
    const expanded = raw
      .split("")
      .map((channel) => channel + channel)
      .join("");
    return `#${expanded}`.toUpperCase();
  }
  return `#${raw}`.toUpperCase();
};

function App() {
  const [capability, setCapability] =
    useState<WebGPUCapabilityResult>(initialStatus);
  const [pigment, setPigment] = useState<PigmentPreset>(pigmentPalette[0]);
  const [customHex, setCustomHex] = useState("#FF8A00");
  const [brushRadius, setBrushRadius] = useState(0.06);
  const [brushFlow, setBrushFlow] = useState(0.6);
  const [tool, setTool] = useState<Tool>("paint");
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [history, setHistory] = useState<SimulationHistory>(NO_HISTORY);
  const simulationHandle = useRef<SimulationHandle | null>(null);
  const customPigment = useMemo<PigmentPreset>(
    () => ({
      id: "custom",
      name: "Custom pigment",
      hex: customHex,
      description: "User-picked pigment.",
      family: "neutral",
      temperature: "neutral",
      colorIndex: null,
      tintingStrength: DEFAULT_TINTING_STRENGTH,
    }),
    [customHex]
  );
  const pigmentLatent = useMemo(
    () => hexToPigmentLatent(pigment.hex),
    [pigment]
  );
  const brushInput = useMemo<BrushInput>(
    () => ({
      latent: pigmentLatent,
      settings: { ...OIL_BRUSH, size: brushRadius, flow: brushFlow },
      tintingStrength: pigment.tintingStrength,
      tool,
    }),
    [brushFlow, brushRadius, pigmentLatent, pigment, tool]
  );

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      const result = await checkWebGPUCapability();
      if (!cancelled) {
        setCapability(result);
      }
    };

    detect();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (pigment.id === customPigment.id && pigment.hex !== customPigment.hex) {
      setPigment(customPigment);
    }
  }, [customPigment, pigment.hex, pigment.id]);

  const handleCustomColorChange = (next: string) => {
    setCustomHex(normalizeHex(next));
  };

  const handleClear = () => {
    simulationHandle.current?.clear();
  };

  const handleUndo = useCallback(() => {
    simulationHandle.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    simulationHandle.current?.redo();
  }, []);

  // Stable so SimulationCanvas's reporting effect does not re-run every render.
  const handleErrorChange = useCallback((message: string | null) => {
    setSimulationError(message);
  }, []);

  const handleHistoryChange = useCallback((next: SimulationHistory) => {
    setHistory(next);
  }, []);

  // mod+y is the Windows convention for redo; mod+shift+z is the Mac one. Both
  // are bound everywhere because neither costs anything.
  useHotkeys({
    "mod+z": handleUndo,
    "mod+shift+z": handleRedo,
    "mod+y": handleRedo,
  });

  const isChecking = capability.status === "checking";
  const isSupported = capability.status === "supported";

  return (
    // The canvas is the page. Everything else floats over it.
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      {isSupported ? (
        <SimulationCanvas
          brushInput={brushInput}
          handleRef={simulationHandle}
          onErrorChange={handleErrorChange}
          onHistoryChange={handleHistoryChange}
        />
      ) : null}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="pointer-events-auto font-semibold text-foreground text-xl tracking-tight sm:text-2xl">
            Colour mixer
          </h1>

          {/*
            A native <details>, so the prose stays in the server-rendered HTML
            and indexable while the canvas keeps the whole viewport. No JS, no
            state, and it collapses out of the way of the dock.
          */}
          <details className="group pointer-events-auto relative">
            <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 text-muted-foreground ring-1 ring-black/5 backdrop-blur-xl transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <h2 className="font-medium text-xs">How the mixing works</h2>
              <ChevronIcon />
            </summary>

            {/* Absolute so opening it never reflows the header row. */}
            <div className="absolute top-full left-0 z-10 mt-2 w-[min(58ch,calc(100vw-2.5rem))] space-y-3 rounded-surface bg-card/95 p-5 text-muted-foreground text-sm leading-relaxed shadow-[0_18px_50px_-24px_rgba(15,10,6,0.5)] ring-1 ring-black/10 backdrop-blur-xl">
              <p>
                Mixing colours on a screen means averaging RGB, which is why
                blue and yellow give you grey there and green everywhere else.
                Here every colour goes into Mixbox’s latent pigment space first.
                Blue dragged through yellow turns green. White pulls a colour
                back to a tint instead of just brightening it.
              </p>

              <p>
                The palette is real paint. Each masstone keeps its Colour Index
                name, so cadmium yellow is PY35 and phthalo blue is PB15, the
                same codes on the side of the tube.
              </p>

              <p>
                Every pigment also carries a tinting strength, and that’s the
                part that catches you. Phthalo blue sits at 3, titanium white at
                0.5. A little phthalo swallows a lot of white, so half and half
                on the canvas is nothing like half and half in the result.
              </p>

              <p>Pick two and drag one through the other.</p>

              <CraftedBy />
            </div>
          </details>
        </div>

        <Button
          asChild
          className="pointer-events-auto shrink-0"
          size="sm"
          variant="ghost"
        >
          <a
            href="https://github.com/mblode/color-mixer"
            rel="noreferrer"
            target="_blank"
          >
            <GitHubMark />
            GitHub
          </a>
        </Button>
      </header>

      {isChecking ? <CanvasMessage>Checking for WebGPU…</CanvasMessage> : null}

      {capability.status === "unsupported" ? (
        <CanvasMessage>
          <p className="font-medium text-base text-foreground">
            This needs WebGPU
          </p>
          <p className="mt-1 max-w-[42ch]">
            {capability.message ??
              "Your browser cannot run the pigment simulation."}
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <a
              href="https://developer.chrome.com/docs/web-platform/webgpu"
              rel="noreferrer"
              target="_blank"
            >
              Open WebGPU docs
            </a>
          </Button>
        </CanvasMessage>
      ) : null}

      {simulationError ? (
        <CanvasMessage>
          <p className="font-medium text-base text-foreground">
            The simulation stopped
          </p>
          <p className="mt-1 max-w-[42ch]">{simulationError}</p>
        </CanvasMessage>
      ) : null}

      {isSupported ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-6">
          {/* Warm tint, not bg-card: a white surface over a white canvas would
              only be visible by its shadow. */}
          {/* No overflow clipping: the swatch tooltips have to escape upward,
              and flex-wrap already handles narrow viewports. */}
          <div className="dock pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-3 rounded-surface bg-background/85 p-(--surface-inset) shadow-[0_18px_50px_-24px_rgba(15,10,6,0.5)] ring-1 ring-black/10 backdrop-blur-xl sm:gap-5">
            <PigmentControls
              customPigment={customPigment}
              onCustomColorChange={handleCustomColorChange}
              onSelectPigment={setPigment}
              palette={pigmentPalette}
              pigment={pigment}
            />

            <span
              aria-hidden="true"
              className="hidden h-14 w-px bg-black/5 lg:block"
            />

            <BrushControls
              flow={brushFlow}
              onFlowChange={setBrushFlow}
              onRadiusChange={setBrushRadius}
              onToolChange={setTool}
              pigmentHex={pigment.hex}
              radius={brushRadius}
              tool={tool}
            />

            <span
              aria-hidden="true"
              className="hidden h-14 w-px bg-black/5 lg:block"
            />

            <div className="flex items-center gap-1">
              <IconButton
                disabled={!history.canUndo}
                hotkey="mod+z"
                label="Undo"
                onClick={handleUndo}
              >
                <UndoIcon />
              </IconButton>
              <IconButton
                disabled={!history.canRedo}
                hotkey="mod+shift+z"
                label="Redo"
                onClick={handleRedo}
              >
                <UndoIcon flipped />
              </IconButton>
              <Button
                onClick={handleClear}
                size="sm"
                type="button"
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface IconButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  hotkey: string;
  label: string;
  onClick: () => void;
}

/**
 * Icon-only, so the accessible name and the visible tooltip both spell out the
 * action and its shortcut. Discoverability matters here: without the tooltip
 * the shortcut is invisible, and on touch there is no keyboard at all.
 */
function IconButton({
  children,
  disabled,
  hotkey,
  label,
  onClick,
}: IconButtonProps) {
  const { aria, label: shortcut } = useHotkeyLabel(hotkey);
  return (
    <button
      aria-keyshortcuts={aria}
      aria-label={`${label} (${shortcut})`}
      className="group relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-foreground px-2.5 py-1.5 font-medium text-[11px] text-background leading-tight group-hover:block group-focus-visible:block"
        role="tooltip"
      >
        {label} <span className="font-mono text-background/70">{shortcut}</span>
      </span>
    </button>
  );
}

/** Curved arrow; mirrored for redo so the pair reads as one gesture. */
function UndoIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", flipped && "-scale-x-100")}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M9 14 4 9l5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4 9h9a7 7 0 0 1 0 14H8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CanvasMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// Inline rather than an icon package: one path, one use.
function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default App;
