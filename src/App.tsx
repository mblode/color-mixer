import { useEffect, useMemo, useState } from 'react'
import { checkWebGPUCapability, type WebGPUCapabilityResult } from './lib/webgpu'
import { WebGPUStatus } from './components/WebGPUStatus'
import { PigmentControls } from './components/PigmentControls'
import { SimulationCanvas } from './components/SimulationCanvas'
import {
  DEFAULT_PIGMENT_SELECTION,
  type PigmentPreset,
  type PigmentSelectionState,
  type PigmentSlot,
  pigmentPalette,
  otherSlot,
} from './lib/pigments'
import { hexToPigmentLatent, mixPigmentPair, ZERO_LATENT } from './lib/mixbox'
import type { BrushInput } from './simulation/types'

const initialStatus: WebGPUCapabilityResult = {
  supported: false,
  status: 'checking',
  message: 'Checking for WebGPU support...',
}

function App() {
  const [capability, setCapability] = useState<WebGPUCapabilityResult>(initialStatus)
  const [pigments, setPigments] = useState<PigmentSelectionState>(DEFAULT_PIGMENT_SELECTION)
  const [activeSlot, setActiveSlot] = useState<PigmentSlot>('A')
  const [ratio, setRatio] = useState(50)
  const mixResult = useMemo(() => mixPigmentPair(pigments.A, pigments.B, ratio), [pigments, ratio])
  const pigmentLatents = useMemo(
    () => ({
      A: pigments.A ? hexToPigmentLatent(pigments.A.hex) : ZERO_LATENT,
      B: pigments.B ? hexToPigmentLatent(pigments.B.hex) : ZERO_LATENT,
    }),
    [pigments],
  )
  const brushInput = useMemo<BrushInput>(
    () => ({
      hexA: pigments.A?.hex ?? '#ffffff',
      hexB: pigments.B?.hex ?? '#ffffff',
      ratio,
      activeSlot,
      latentA: pigmentLatents.A,
      latentB: pigmentLatents.B,
    }),
    [pigments, ratio, activeSlot, pigmentLatents],
  )

  useEffect(() => {
    let cancelled = false

    const detect = async () => {
      const result = await checkWebGPUCapability()
      if (!cancelled) {
        setCapability(result)
      }
    }

    detect()

    return () => {
      cancelled = true
    }
  }, [])

  const setPigmentForSlot = (slot: PigmentSlot, pigment: PigmentPreset) => {
    setPigments((prev) => ({ ...prev, [slot]: pigment }))
  }

  const removePigment = (slot: PigmentSlot) => {
    setPigments((prev) => {
      const next: PigmentSelectionState = { ...prev, [slot]: null }
      if (activeSlot === slot) {
        const fallback = otherSlot(slot)
        if (next[fallback]) {
          setActiveSlot(fallback)
        }
      }
      return next
    })
  }

  const swapPigments = () => {
    setPigments((prev) => ({ A: prev.B, B: prev.A }))
    setActiveSlot((slot) => otherSlot(slot))
  }

  const showCanvasPlaceholder = capability.status === 'supported'

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">Phase 5 · Realistic Color Mixing</p>
          <h1>Paint Mixer MVP</h1>
          <p className="lede">
            Mix realistic pigments on a WebGPU canvas using Mixbox color math. Select two pigments, adjust their
            ratio, and paint to watch them blend with physically accurate color behavior.
          </p>
        </div>
      </header>

      <main className="app__main">
        <section className="app__controls">
          <WebGPUStatus result={capability} />
          <PigmentControls
            palette={pigmentPalette}
            pigments={pigments}
            activeSlot={activeSlot}
            ratio={ratio}
            mixResult={mixResult}
            onSelectPigment={setPigmentForSlot}
            onSetActiveSlot={setActiveSlot}
            onRemovePigment={removePigment}
            onSwapPigments={swapPigments}
            onUpdateRatio={setRatio}
          />
        </section>

        {showCanvasPlaceholder ? (
          <SimulationCanvas brushInput={brushInput} />
        ) : (
          <section className="canvas-fallback" aria-label="WebGPU fallback message">
            <h2>WebGPU required</h2>
            <p>
              Your browser did not pass the WebGPU capability check. Try Chrome 113+, Edge 113+, or Safari Technology
              Preview with the "WebGPU" flag enabled.
            </p>
            {capability.message ? <p className="canvas-fallback__details">Details: {capability.message}</p> : null}
            <ul className="canvas-fallback__steps">
              <li>Enable the WebGPU/Unsafe WebGPU flag in your browser settings and restart.</li>
              <li>Ensure hardware acceleration is enabled in the browser/system preferences.</li>
              <li>Reload this page after enabling WebGPU to re-run the capability check.</li>
            </ul>
            <p className="canvas-fallback__actions">
              Visit{' '}
              <a href="https://developer.chrome.com/docs/web-platform/webgpu" target="_blank" rel="noreferrer">
                WebGPU docs
              </a>{' '}
              for enablement instructions.
            </p>
          </section>
        )}
      </main>

      <footer className="app__footer">
        <p>
          Mixing powered by{' '}
          <a href="https://scrtwpns.com/mixbox" target="_blank" rel="noreferrer">
            Mixbox
          </a>{' '}
          · CC BY-NC 4.0 · © Secret Weapons
        </p>
      </footer>
    </div>
  )
}

export default App
