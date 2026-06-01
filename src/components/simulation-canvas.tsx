import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FluidSimulation } from "../simulation/fluid";
import type { BrushInput, SimulationStatus } from "../simulation/types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export interface SimulationCanvasProps {
  brushInput: BrushInput;
}

export function SimulationCanvas({ brushInput }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<FluidSimulation | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string>(
    "Waiting for initialization..."
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const simulation = new FluidSimulation(canvas, {
      onStatusChange: (nextStatus, detail) => {
        setStatus(nextStatus);
        if (detail) {
          setStatusDetail(detail);
        }
      },
    });
    simulationRef.current = simulation;
    simulation.attachResizeObserver();

    simulation
      .initialize()
      .then(() => {
        setStatusDetail("WebGPU canvas ready");
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Unknown WebGPU error";
        setStatus("error");
        setStatusDetail(message);
      });

    return () => {
      simulation.destroy();
      simulationRef.current = null;
    };
  }, []);

  useEffect(() => {
    simulationRef.current?.updateBrushInput(brushInput);
  }, [brushInput]);

  const pointerHandlers = useMemo(() => {
    // Read the canvas rect once per event — getBoundingClientRect forces a
    // layout, and a move event can carry dozens of coalesced samples.
    const canvasMetrics = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return null;
      }
      return {
        rect: canvas.getBoundingClientRect(),
        dpr: window.devicePixelRatio || 1,
      };
    };

    // Convert a native pointer sample (client coords + pressure) into a
    // device-pixel StrokeSample for the brush engine.
    const toSample = (
      metrics: { rect: DOMRect; dpr: number },
      clientX: number,
      clientY: number,
      pressure: number,
      time: number
    ) => ({
      x: (clientX - metrics.rect.left) * metrics.dpr,
      y: (clientY - metrics.rect.top) * metrics.dpr,
      // Mouse reports 0.5 while a button is held; a pen reports real pressure.
      pressure: pressure > 0 ? pressure : 0.5,
      time,
    });

    return {
      onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (
          activePointerIdRef.current !== null &&
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        const metrics = canvasMetrics();
        if (!metrics) {
          return;
        }
        activePointerIdRef.current = event.pointerId;
        isPointerDownRef.current = true;
        canvasRef.current?.setPointerCapture(event.pointerId);
        simulationRef.current?.strokeBegin(
          toSample(
            metrics,
            event.clientX,
            event.clientY,
            event.pressure,
            event.timeStamp
          )
        );
      },
      onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
          !isPointerDownRef.current ||
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        event.preventDefault();
        const metrics = canvasMetrics();
        if (!metrics) {
          return;
        }
        // Replay every coalesced sample the browser merged into this event so
        // fast strokes stay smooth rather than polygonal.
        const native = event.nativeEvent;
        const samples = native.getCoalescedEvents
          ? native.getCoalescedEvents()
          : [native];
        for (const point of samples) {
          simulationRef.current?.strokeExtend(
            toSample(
              metrics,
              point.clientX,
              point.clientY,
              point.pressure,
              point.timeStamp
            )
          );
        }
      },
      onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
          activePointerIdRef.current !== null &&
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        canvasRef.current?.releasePointerCapture(event.pointerId);
        simulationRef.current?.strokeEnd();
      },
      onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
          activePointerIdRef.current !== null &&
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        simulationRef.current?.strokeEnd();
      },
      onPointerLeave: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
          activePointerIdRef.current !== null &&
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        simulationRef.current?.strokeEnd();
      },
    };
  }, []);

  const handleClear = () => {
    simulationRef.current?.clearSurface();
  };

  const showDetail = status === "error";
  return (
    <Card className="shadow-soft">
      <CardContent className="space-y-3 pt-6">
        <div className="overflow-hidden rounded-3xl border bg-white shadow-inner">
          <canvas
            aria-label="Pigment canvas"
            className="h-[60vh] w-full touch-none select-none"
            onContextMenu={(event) => event.preventDefault()}
            ref={canvasRef}
            {...pointerHandlers}
          />
        </div>
        <div className="flex items-center justify-end">
          <Button
            onClick={handleClear}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear
          </Button>
        </div>
        {showDetail ? (
          <p className="text-destructive text-xs">{statusDetail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
