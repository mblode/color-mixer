import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { FluidSimulation } from '../simulation/fluid'
import type { BrushInput } from '../simulation/types'
import type { SimulationMetrics, SimulationStatus } from '../simulation/types'

export interface SimulationCanvasProps {
  brushInput: BrushInput
}

export function SimulationCanvas({ brushInput }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simulationRef = useRef<FluidSimulation | null>(null)
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [statusDetail, setStatusDetail] = useState<string>('Waiting for initialization...')
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const simulation = new FluidSimulation(canvas, {
      onStatusChange: (nextStatus, detail) => {
        setStatus(nextStatus)
        if (detail) setStatusDetail(detail)
      },
      onMetrics: (nextMetrics) => setMetrics(nextMetrics),
    })
    simulationRef.current = simulation
    simulation.attachResizeObserver()

    simulation
      .initialize()
      .then(() => {
        setStatusDetail('WebGPU canvas ready')
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown WebGPU error'
        setStatus('error')
        setStatusDetail(message)
      })

    return () => {
      simulation.destroy()
      simulationRef.current = null
    }
  }, [])

  useEffect(() => {
    simulationRef.current?.updateBrushInput(brushInput)
  }, [brushInput])

  const pointerHandlers = useMemo(() => {
    const getCoordinates = (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const x = (event.clientX - rect.left) * dpr
      const y = (event.clientY - rect.top) * dpr
      return { x, y }
    }

    return {
      onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const coords = getCoordinates(event)
        if (!coords) return
        canvasRef.current?.setPointerCapture(event.pointerId)
        simulationRef.current?.handlePointerDown(coords.x, coords.y)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (event.buttons === 0) return
        const coords = getCoordinates(event)
        if (!coords) return
        simulationRef.current?.handlePointerMove(coords.x, coords.y)
      },
      onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        canvasRef.current?.releasePointerCapture(event.pointerId)
        simulationRef.current?.handlePointerUp()
      },
      onPointerLeave: () => {
        simulationRef.current?.handlePointerUp()
      },
    }
  }, [])

  const handleTogglePause = () => {
    const next = !isPaused
    setIsPaused(next)
    simulationRef.current?.setPaused(next)
  }

  const handleClear = () => {
    simulationRef.current?.clearSurface()
  }

  return (
    <section className="simulation-panel" aria-live="polite">
      <header>
        <p className="eyebrow">Phase 5 · Realistic Color Mixing</p>
        <h2>Fluid pigment playground</h2>
        <p className="lede">
          Paint with either selected pigment, blend them using Mixbox ratios, and watch realistic color mixing unfold on
          the WebGPU canvas. Each pixel mixes pigment concentrations through Mixbox latent space for true-to-life results.
        </p>
      </header>

      <div className="simulation-panel__body">
        <canvas
          ref={canvasRef}
          className="simulation-canvas"
          aria-label="Fluid pigment canvas"
          {...pointerHandlers}
        />
        <div className="simulation-status">
          <p className="simulation-status__label">
            Status:{' '}
            <span className={`simulation-status__badge simulation-status__badge--${status}`}>
              {status === 'ready' ? (isPaused ? 'Paused' : 'Running') : status}
            </span>
          </p>
          <p className="simulation-status__detail">{statusDetail}</p>
          {metrics ? (
            <p className="simulation-status__metrics">
              {metrics.fps} FPS · {metrics.frameTimeMs.toFixed(1)} ms/frame · {metrics.textureResolution.width} × {metrics.textureResolution.height}
            </p>
          ) : null}
          <div className="simulation-actions">
            <button type="button" className="primary-button" onClick={handleTogglePause}>
              {isPaused ? 'Resume Simulation' : 'Pause Simulation'}
            </button>
            <button type="button" className="ghost-button" onClick={handleClear}>
              Clear Canvas
            </button>
          </div>
          <div className="simulation-instructions">
            <p className="simulation-instructions__title">Quick tips</p>
            <ul>
              <li>Drag on the canvas to inject the active pigment.</li>
              <li>Use the ratio slider to rebalance the Mixbox blend in real time.</li>
              <li>Pause when you want to inspect a swatch, then resume to keep the flow moving.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
