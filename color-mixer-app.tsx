"use client";

import { useEffect, useMemo, useState } from "react";

import { OIL_BRUSH } from "./brush/oil-brush";
import type { Tool } from "./brush/types";
import { BrushControls } from "./components/brush-controls";
import { PigmentControls } from "./components/pigment-controls";
import { SimulationCanvas } from "./components/simulation-canvas";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { DEFAULT_TINTING_STRENGTH } from "./lib/color/mix-engine";
import { hexToPigmentLatent } from "./lib/mixbox";
import { type PigmentPreset, pigmentPalette } from "./lib/pigments";
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

const statusLabel = {
  checking: "Checking WebGPU…",
  supported: "WebGPU ready",
  unsupported: "WebGPU unavailable",
};

// Inline rather than an icon package: one path, one use.
const GitHubMark = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

function App() {
  const [capability, setCapability] =
    useState<WebGPUCapabilityResult>(initialStatus);
  const [pigment, setPigment] = useState<PigmentPreset>(pigmentPalette[0]);
  const [customHex, setCustomHex] = useState("#FF8A00");
  const [brushRadius, setBrushRadius] = useState(0.06);
  const [brushFlow, setBrushFlow] = useState(0.6);
  const [tool, setTool] = useState<Tool>("paint");
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

  const setActivePigment = (next: PigmentPreset) => {
    setPigment(next);
  };

  const handleCustomColorChange = (next: string) => {
    setCustomHex(normalizeHex(next));
  };

  const showCanvas = capability.status === "supported";
  const showFallback = capability.status === "unsupported";
  const statusText = statusLabel[capability.status];

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
              Colour mixer
            </h1>
            {capability.status === "unsupported" ? (
              <p className="text-muted-foreground text-sm">{statusText}</p>
            ) : null}
          </div>
          <Button asChild size="sm" variant="ghost">
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

        <main className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <PigmentControls
              customPigment={customPigment}
              onCustomColorChange={handleCustomColorChange}
              onSelectPigment={setActivePigment}
              palette={pigmentPalette}
              pigment={pigment}
            />
            <BrushControls
              flow={brushFlow}
              onFlowChange={setBrushFlow}
              onRadiusChange={setBrushRadius}
              onToolChange={setTool}
              radius={brushRadius}
              tool={tool}
            />
          </div>

          {showCanvas ? (
            <SimulationCanvas brushInput={brushInput} />
          ) : (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>WebGPU not available</CardTitle>
                <CardDescription>Use a WebGPU-enabled browser.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showFallback && capability.message ? (
                  <p className="text-muted-foreground text-sm">
                    {capability.message}
                  </p>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <a
                    href="https://developer.chrome.com/docs/web-platform/webgpu"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open WebGPU docs
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        {/*
          Below the tool rather than above it: the canvas is what people came
          for, and this is the only prose on the page for anyone who arrives
          without WebGPU or without JavaScript.
        */}
        <section className="max-w-[70ch] space-y-4 text-muted-foreground text-sm leading-relaxed">
          <h2 className="font-medium text-base text-foreground">
            How the mixing works
          </h2>

          <p>
            Mixing colours on a screen means averaging RGB, which is why blue
            and yellow give you grey there and green everywhere else. Here every
            colour goes into Mixbox’s latent pigment space first. Blue dragged
            through yellow turns green. White pulls a colour back to a tint
            instead of just brightening it.
          </p>

          <p>
            The palette is real paint. Each masstone keeps its Colour Index
            name, so cadmium yellow is PY35 and phthalo blue is PB15, the same
            codes on the side of the tube.
          </p>

          <p>
            Every pigment also carries a tinting strength, and that’s the part
            that catches you. Phthalo blue sits at 3, titanium white at 0.5. A
            little phthalo swallows a lot of white, so half and half on the
            canvas is nothing like half and half in the result.
          </p>

          <p>Pick two and drag one through the other.</p>
        </section>
      </div>
    </div>
  );
}

export default App;
