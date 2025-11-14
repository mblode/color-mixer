import type { PigmentPreset, PigmentSlot } from '../lib/pigments'

export interface PigmentSlotSelectorProps {
  slot: PigmentSlot
  palette: PigmentPreset[]
  selectedPigment: PigmentPreset | null
  isActive: boolean
  onSelect: (slot: PigmentSlot, pigment: PigmentPreset) => void
  onSetActive: (slot: PigmentSlot) => void
}

export function PigmentSlotSelector({
  slot,
  palette,
  selectedPigment,
  isActive,
  onSelect,
  onSetActive,
}: PigmentSlotSelectorProps) {
  return (
    <div className={`pigment-slot ${isActive ? 'pigment-slot--active' : ''}`}>
      <div className="pigment-slot__header">
        <div>
          <p className="eyebrow">Pigment {slot}</p>
          <h3>{selectedPigment ? selectedPigment.name : 'Unassigned'}</h3>
          <p className="pigment-slot__meta">
            {selectedPigment
              ? `${selectedPigment.temperature.toUpperCase()} · ${selectedPigment.family.toUpperCase()}`
              : 'Choose a pigment from the palette below.'}
          </p>
        </div>
        <button
          type="button"
          className="pill-button"
          aria-pressed={isActive}
          onClick={() => onSetActive(slot)}
        >
          {isActive ? 'Active for painting' : 'Set active'}
        </button>
      </div>

      <div className="pigment-slot__palette" role="list">
        {palette.map((pigment) => {
          const isSelected = selectedPigment?.id === pigment.id
          return (
            <button
              key={`${slot}-${pigment.id}`}
              type="button"
              role="listitem"
              className={`pigment-chip ${isSelected ? 'pigment-chip--selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(slot, pigment)}
            >
              <span className="pigment-chip__swatch" style={{ backgroundColor: pigment.hex }} />
              <span className="pigment-chip__details">
                <span className="pigment-chip__name">{pigment.name}</span>
                <span className="pigment-chip__description">{pigment.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
