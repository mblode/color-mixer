import { useEffect, useMemo, useState } from 'react'
import { checkWebGPUCapability, type WebGPUCapabilityResult } from './lib/webgpu'
import { PigmentControls } from './components/PigmentControls'
import { SimulationCanvas } from './components/SimulationCanvas'
import { type PigmentPreset, pigmentPalette } from './lib/pigments'
import { hexToPigmentLatent, ZERO_LATENT } from './lib/mixbox'
import type { BrushInput } from './simulation/types'

const initialStatus: WebGPUCapabilityResult = {
  supported: false,
  status: 'checking',
  message: 'Checking for WebGPU support...',
}

const normalizeHex = (value: string) => {
  const raw = value.trim().replace('#', '')
  if (raw.length === 3) {
    const expanded = raw
      .split('')
      .map((channel) => channel + channel)
      .join('')
    return `#${expanded}`.toUpperCase()
  }
  return `#${raw}`.toUpperCase()
}

function App() {
  const [capability, setCapability] = useState<WebGPUCapabilityResult>(initialStatus)
  const [pigment, setPigment] = useState<PigmentPreset>(pigmentPalette[0])
  const [customHex, setCustomHex] = useState('#FF8A00')
  const customPigment = useMemo<PigmentPreset>(
    () => ({
      id: 'custom',
      name: 'Custom Pigment',
      hex: customHex,
      mixboxPigment: 'custom',
      description: 'User-picked pigment.',
      family: 'primary',
      temperature: 'neutral',
    }),
    [customHex],
  )
  const pigmentLatent = useMemo(() => (pigment ? hexToPigmentLatent(pigment.hex) : ZERO_LATENT), [pigment])
  const brushInput = useMemo<BrushInput>(
    () => ({
      latent: pigmentLatent,
    }),
    [pigmentLatent],
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

  useEffect(() => {
    if (pigment.id === customPigment.id && pigment.hex !== customPigment.hex) {
      setPigment(customPigment)
    }
  }, [customPigment, pigment.hex, pigment.id])

  const setActivePigment = (next: PigmentPreset) => {
    setPigment(next)
  }

  const handleCustomColorChange = (next: string) => {
    setCustomHex(normalizeHex(next))
  }

  const showCanvas = capability.status === 'supported'
  const showFallback = capability.status === 'unsupported'

  return (
    <div className="app">
      <header className="app__header">
        <h1>Color Mixer</h1>
      </header>

      <main className="app__main">
        <section className="panel app__controls">
          <PigmentControls
            palette={pigmentPalette}
            pigment={pigment}
            customPigment={customPigment}
            onCustomColorChange={handleCustomColorChange}
            onSelectPigment={setActivePigment}
          />
        </section>

        {showCanvas ? (
          <SimulationCanvas brushInput={brushInput} />
        ) : (
          <section className="panel canvas-fallback" aria-label="WebGPU status message">
            {showFallback ? (
              <>
                <p>WebGPU is unavailable. Use a recent Chromium build with WebGPU enabled.</p>
                {capability.message ? <p className="canvas-fallback__details">{capability.message}</p> : null}
                <a href="https://developer.chrome.com/docs/web-platform/webgpu" target="_blank" rel="noreferrer">
                  WebGPU docs
                </a>
              </>
            ) : (
              <p>Checking WebGPU support...</p>
            )}
          </section>
        )}
      </main>

      <footer className="app__footer">
        <p>
          Mixing via{' '}
          <a href="https://scrtwpns.com/mixbox" target="_blank" rel="noreferrer">
            Mixbox
          </a>
          .
        </p>
      </footer>
    </div>
  )
}

export default App
