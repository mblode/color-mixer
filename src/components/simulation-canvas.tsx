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
    const getCoordinates = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (event.clientX - rect.left) * dpr;
      const y = (event.clientY - rect.top) * dpr;
      return { x, y };
    };

    return {
      onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (
          activePointerIdRef.current !== null &&
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        const coords = getCoordinates(event);
        if (!coords) {
          return;
        }
        activePointerIdRef.current = event.pointerId;
        isPointerDownRef.current = true;
        canvasRef.current?.setPointerCapture(event.pointerId);
        simulationRef.current?.handlePointerDown(coords.x, coords.y);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
          !isPointerDownRef.current ||
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        event.preventDefault();
        const coords = getCoordinates(event);
        if (!coords) {
          return;
        }
        simulationRef.current?.handlePointerMove(coords.x, coords.y);
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
        simulationRef.current?.handlePointerUp();
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
        simulationRef.current?.handlePointerUp();
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
        simulationRef.current?.handlePointerUp();
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
