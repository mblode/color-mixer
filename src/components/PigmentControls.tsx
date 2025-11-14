import type {
  PigmentPreset,
  PigmentSelectionState,
  PigmentSlot,
} from '../lib/pigments'
import { pigmentSlots } from '../lib/pigments'
import { PigmentSlotSelector } from './PigmentSlotSelector'
import { PigmentRatioSlider } from './PigmentRatioSlider'
import { SelectedPigmentsPanel } from './SelectedPigmentsPanel'
import type { PigmentMixResult } from '../lib/mixbox'
import { PigmentMixPreview } from './PigmentMixPreview'

export interface PigmentControlsProps {
  palette: PigmentPreset[]
  pigments: PigmentSelectionState
  activeSlot: PigmentSlot
  ratio: number
  mixResult: PigmentMixResult | null
  onSelectPigment: (slot: PigmentSlot, pigment: PigmentPreset) => void
  onSetActiveSlot: (slot: PigmentSlot) => void
  onRemovePigment: (slot: PigmentSlot) => void
  onSwapPigments: () => void
  onUpdateRatio: (ratio: number) => void
}

export function PigmentControls({
  palette,
  pigments,
  activeSlot,
  ratio,
  mixResult,
  onSelectPigment,
  onSetActiveSlot,
  onRemovePigment,
  onSwapPigments,
  onUpdateRatio,
}: PigmentControlsProps) {
  const ratioDisabled = !pigments.A || !pigments.B

  return (
    <section className="pigment-controls">
      <header>
        <p className="eyebrow">Phase 2 · Pigment Selection</p>
        <h2>Choose your pigments</h2>
        <p className="lede">
          Pick two pigments, decide which one the brush uses, and tune their blend ratio. These controls will later
          influence the Mixbox preview and the WebGPU brush injection.
        </p>
      </header>

      <div className="pigment-controls__slots">
        {pigmentSlots.map((slot) => (
          <PigmentSlotSelector
            key={slot}
            slot={slot}
            palette={palette}
            selectedPigment={pigments[slot]}
            isActive={activeSlot === slot}
            onSelect={onSelectPigment}
            onSetActive={onSetActiveSlot}
          />
        ))}
      </div>

      <PigmentRatioSlider
        value={ratio}
        onChange={onUpdateRatio}
        disabled={ratioDisabled}
        pigmentA={pigments.A}
        pigmentB={pigments.B}
      />

      <SelectedPigmentsPanel
        pigments={pigments}
        activeSlot={activeSlot}
        onSetActive={onSetActiveSlot}
        onRemove={onRemovePigment}
        onSwap={onSwapPigments}
      />

      <PigmentMixPreview pigments={pigments} mixResult={mixResult} />
    </section>
  )
}
