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
        <header className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
            Colour mixer
          </h1>
          {capability.status === "unsupported" ? (
            <p className="text-muted-foreground text-sm">{statusText}</p>
          ) : null}
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
      </div>
    </div>
  );
}

export default App;
