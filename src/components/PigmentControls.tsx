import { HexColorInput, HexColorPicker } from 'react-colorful'
import type { PigmentPreset } from '../lib/pigments'

export interface PigmentControlsProps {
  palette: PigmentPreset[]
  pigment: PigmentPreset
  customPigment: PigmentPreset
  onSelectPigment: (pigment: PigmentPreset) => void
  onCustomColorChange: (hex: string) => void
}

export function PigmentControls({
  palette,
  pigment,
  customPigment,
  onSelectPigment,
  onCustomColorChange,
}: PigmentControlsProps) {
  const pigmentId = pigment?.id ?? ''
  const isCustomActive = pigmentId === customPigment.id
  const handleCustomChange = (next: string) => {
    onCustomColorChange(next)
    onSelectPigment(customPigment)
  }

  return (
    <div className="pigment-controls">
      <p className="control-label">Pigment</p>
      <div className="swatch-row" role="list">
        {palette.map((item) => {
          const isActive = item.id === pigmentId
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={`swatch-button ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
              aria-label={item.name}
              title={item.name}
              onClick={() => onSelectPigment(item)}
            >
              <span className="swatch" style={{ backgroundColor: item.hex }} />
            </button>
          )
        })}
      </div>

      <div className="custom-row">
        <HexColorPicker color={customPigment.hex} onChange={handleCustomChange} />
        <div className="custom-inputs">
          <HexColorInput
            className="custom-input"
            color={customPigment.hex}
            onChange={handleCustomChange}
            prefixed
            aria-label="Custom pigment hex"
            placeholder="#RRGGBB"
          />
          <button
            type="button"
            className={`custom-preview ${isCustomActive ? 'is-active' : ''}`}
            style={{ backgroundColor: customPigment.hex }}
            aria-label="Use custom pigment"
            title="Use custom pigment"
            onClick={() => onSelectPigment(customPigment)}
          />
        </div>
      </div>
    </div>
  )
}
