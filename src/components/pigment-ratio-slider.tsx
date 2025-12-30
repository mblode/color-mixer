import type { PigmentPreset } from "../lib/pigments";

interface PigmentRatioSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  pigmentA: PigmentPreset | null;
  pigmentB: PigmentPreset | null;
}

export function PigmentRatioSlider({
  value,
  onChange,
  disabled,
  pigmentA,
  pigmentB,
}: PigmentRatioSliderProps) {
  const aLabel = pigmentA?.name ?? "Pigment A";
  const bLabel = pigmentB?.name ?? "Pigment B";

  return (
    <div className={`ratio-slider ${disabled ? "ratio-slider--disabled" : ""}`}>
      <div className="ratio-slider__labels">
        <span>
          {aLabel} · {value}%
        </span>
        <span>
          {bLabel} · {100 - value}%
        </span>
      </div>
      <input
        aria-label="Adjust pigment blend ratio"
        disabled={disabled}
        max={100}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      {disabled ? (
        <p className="ratio-slider__hint">
          Select two pigments to unlock the blend slider.
        </p>
      ) : null}
    </div>
  );
}
