import { HexColorInput, HexColorPicker } from "react-colorful";
import type { PigmentPreset } from "../lib/pigments";

export interface PigmentControlsProps {
  palette: PigmentPreset[];
  pigment: PigmentPreset;
  customPigment: PigmentPreset;
  onSelectPigment: (pigment: PigmentPreset) => void;
  onCustomColorChange: (hex: string) => void;
}

export function PigmentControls({
  palette,
  pigment,
  customPigment,
  onSelectPigment,
  onCustomColorChange,
}: PigmentControlsProps) {
  const pigmentId = pigment?.id ?? "";
  const isCustomActive = pigmentId === customPigment.id;
  const handleCustomChange = (next: string) => {
    onCustomColorChange(next);
    onSelectPigment(customPigment);
  };

  return (
    <div className="pigment-controls">
      <p className="control-label">Pigment</p>
      <ul className="swatch-row">
        {palette.map((item) => {
          const isActive = item.id === pigmentId;
          return (
            <li key={item.id}>
              <button
                aria-label={item.name}
                aria-pressed={isActive}
                className={`swatch-button ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectPigment(item)}
                title={item.name}
                type="button"
              >
                <span
                  className="swatch"
                  style={{ backgroundColor: item.hex }}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="custom-row">
        <HexColorPicker
          color={customPigment.hex}
          onChange={handleCustomChange}
        />
        <div className="custom-inputs">
          <HexColorInput
            aria-label="Custom pigment hex"
            className="custom-input"
            color={customPigment.hex}
            onChange={handleCustomChange}
            placeholder="#RRGGBB"
            prefixed
          />
          <button
            aria-label="Use custom pigment"
            className={`custom-preview ${isCustomActive ? "is-active" : ""}`}
            onClick={() => onSelectPigment(customPigment)}
            style={{ backgroundColor: customPigment.hex }}
            title="Use custom pigment"
            type="button"
          />
        </div>
      </div>
    </div>
  );
}
