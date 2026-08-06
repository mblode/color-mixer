import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FluidSimulation } from "../simulation/fluid";
import type { BrushInput, SimulationStatus } from "../simulation/types";

export interface SimulationHandle {
  clear: () => void;
}

export interface SimulationCanvasProps {
  brushInput: BrushInput;
  /** Lets the dock drive Clear, which lives outside this component now. */
  handleRef?: RefObject<SimulationHandle | null>;
  /** Surfaced in the dock rather than under the canvas. */
  onErrorChange?: (message: string | null) => void;
}

export function SimulationCanvas({
  brushInput,
  handleRef,
  onErrorChange,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<FluidSimulation | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);
  const [isHovering, setIsHovering] = useState(false);
  const [canvasMinDimension, setCanvasMinDimension] = useState(0);
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

  // Written straight to the DOM rather than through state: a pointermove can
  // arrive at the display's full refresh rate, and re-rendering the tree at
  // that rate to move one ring would be the most expensive thing on screen.
  const moveRing = useCallback(
    (rect: DOMRect, clientX: number, clientY: number) => {
      const ring = ringRef.current;
      if (!ring) {
        return;
      }
      ring.style.transform = `translate3d(${clientX - rect.left}px, ${clientY - rect.top}px, 0) translate(-50%, -50%)`;
    },
    []
  );

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
        moveRing(metrics.rect, event.clientX, event.clientY);
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
        const metrics = canvasMetrics();
        if (!metrics) {
          return;
        }
        // The ring tracks the pointer whether or not a stroke is in progress,
        // so the brush size is visible before you commit any paint.
        moveRing(metrics.rect, event.clientX, event.clientY);

        if (
          !isPointerDownRef.current ||
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        event.preventDefault();
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
      onPointerEnter: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        // Touch has no hover, so a ring would be stranded wherever the last
        // tap landed.
        if (event.pointerType === "touch") {
          return;
        }
        const metrics = canvasMetrics();
        if (metrics) {
          moveRing(metrics.rect, event.clientX, event.clientY);
        }
        setIsHovering(true);
      },
      onPointerLeave: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        setIsHovering(false);
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
  }, [moveRing]);

  useEffect(() => {
    if (!handleRef) {
      return;
    }
    handleRef.current = {
      clear: () => simulationRef.current?.clearSurface(),
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  useEffect(() => {
    onErrorChange?.(status === "error" ? statusDetail : null);
  }, [onErrorChange, status, statusDetail]);

  // The ring has to be sized in CSS pixels, and the brush is a fraction of the
  // canvas's smaller side, so that dimension has to be in render state.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasMinDimension(Math.min(width, height));
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Stroke.baseRadius is (settings.size * minDimension) / 2 in device pixels,
  // so the ring's CSS diameter is size * the smaller CSS dimension.
  const ringDiameter = brushInput.settings.size * canvasMinDimension;

  return (
    <>
      <canvas
        aria-label="Pigment canvas"
        // The ring is the cursor, so the arrow would only be a second,
        // wrongly-sized pointer next to it.
        className="absolute inset-0 h-full w-full cursor-none touch-none select-none"
        onContextMenu={(event) => event.preventDefault()}
        ref={canvasRef}
        {...pointerHandlers}
      />

      {/* Dark ring with a light halo, so it stays visible over both bare
          canvas and dark paint. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-full border border-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
        ref={ringRef}
        style={{
          height: ringDiameter,
          width: ringDiameter,
          opacity: isHovering ? 1 : 0,
          borderStyle: brushInput.tool === "smudge" ? "dashed" : "solid",
        }}
      />
    </>
  );
}
