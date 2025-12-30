import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FluidSimulation } from "../simulation/fluid";
import type { BrushInput, SimulationStatus } from "../simulation/types";

export interface SimulationCanvasProps {
  brushInput: BrushInput;
}

export function SimulationCanvas({ brushInput }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<FluidSimulation | null>(null);
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
        const coords = getCoordinates(event);
        if (!coords) {
          return;
        }
        canvasRef.current?.setPointerCapture(event.pointerId);
        simulationRef.current?.handlePointerDown(coords.x, coords.y);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (event.buttons === 0) {
          return;
        }
        const coords = getCoordinates(event);
        if (!coords) {
          return;
        }
        simulationRef.current?.handlePointerMove(coords.x, coords.y);
      },
      onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        canvasRef.current?.releasePointerCapture(event.pointerId);
        simulationRef.current?.handlePointerUp();
      },
      onPointerLeave: () => {
        simulationRef.current?.handlePointerUp();
      },
    };
  }, []);

  const handleClear = () => {
    simulationRef.current?.clearSurface();
  };

  const showStatus = status === "error";

  return (
    <section aria-live="polite" className="panel canvas-panel">
      <div className="canvas-toolbar">
        {showStatus ? (
          <span className="canvas-status">{statusDetail}</span>
        ) : (
          <span className="canvas-status" />
        )}
        <button className="ghost-button" onClick={handleClear} type="button">
          Clear
        </button>
      </div>

      <canvas
        aria-label="Pigment canvas"
        className="simulation-canvas"
        ref={canvasRef}
        {...pointerHandlers}
      />
    </section>
  );
}
