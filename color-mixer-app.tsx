"use client";

import { CircleInfoIcon, GithubIcon } from "blode-icons-react";
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
import { ZoneBreadcrumb } from "./components/zone-breadcrumb";
import { DEFAULT_TINTING_STRENGTH } from "./lib/color/mix-engine";
import { hexToPigmentLatent } from "./lib/mixbox";
import { type PigmentPreset, pigmentPalette } from "./lib/pigments";
import { useHotkeys } from "./lib/use-hotkeys";
import {
  checkWebGPUCapability,
  type WebGPUCapabilityResult,
} from "./lib/webgpu";
import type { BrushInput } from "./simulation/types";

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
        />
      ) : null}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-5 sm:p-6">
        {/* Root page only, and it has to match the BreadcrumbList in
            app/page.tsx exactly. Visible title lives in the trail; keep a
            screen-reader h1 so the page still has a document heading. */}
        <div className="pointer-events-auto min-w-0">
          <h1 className="sr-only">Colour Mixer</h1>
          <ZoneBreadcrumb product="Colour Mixer" />
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-0.5">
          <Button asChild size="icon" variant="ghost">
            <a
              aria-label="GitHub"
              href="https://github.com/mblode/color-mixer"
              rel="noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-4" />
            </a>
          </Button>

          {/*
            A native <details>, so the prose stays in the server-rendered HTML
            and indexable while the canvas keeps the whole viewport. No JS, no
            state, and it collapses out of the way of the dock.
          */}
          <details className="group relative">
            <summary
              aria-label="How the mixing works"
              className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
            >
              <CircleInfoIcon aria-hidden="true" className="size-4" />
            </summary>

            {/* Absolute so opening it never reflows the header row. */}
            <div className="absolute top-full right-0 z-10 mt-2 w-[min(58ch,calc(100vw-2.5rem))] space-y-3 rounded-surface bg-card/95 p-5 text-muted-foreground text-sm leading-relaxed shadow-[0_8px_30px_-6px_rgba(15,10,6,0.18)] ring-1 ring-inset ring-black/10 backdrop-blur-xl">
              <h2 className="font-medium text-foreground text-sm">
                How the mixing works
              </h2>
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
            </div>
          </details>
        </div>
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

      {/* The dock is gated on WebGPU, the credit is not: `isSupported` only
          becomes true in an effect, so anything inside that branch is missing
          from the server-rendered HTML a crawler reads. A column, so the two
          never overlap on a narrow viewport. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 sm:p-6">
        {isSupported ? (
          <>
            {/* Warm tint, not bg-card: a white surface over a white canvas would
              only be visible by its shadow. */}
            {/* No overflow clipping: the swatch tooltips have to escape upward,
              and flex-wrap already handles narrow viewports. */}
            {/* Inset ring, not an outset one: an outset ring paints outside the
              backdrop-filtered box and seams against it, which reads as a
              second edge along the bottom where the shadow makes it legible. */}
            <div className="dock pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-3 rounded-surface bg-background/85 p-(--surface-inset) shadow-[0_8px_30px_-6px_rgba(15,10,6,0.18)] ring-1 ring-inset ring-black/10 backdrop-blur-xl sm:gap-5">
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

              <Button
                onClick={handleClear}
                size="sm"
                type="button"
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </>
        ) : null}

        {/* A real contentinfo landmark. This used to be a credit inside the
            "How the mixing works" disclosure, which a closed <details> keeps
            out of the accessibility tree entirely. */}
        <footer className="pointer-events-auto">
          <CraftedBy />
        </footer>
      </div>
    </div>
  );
}

function CanvasMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}

export default App;
