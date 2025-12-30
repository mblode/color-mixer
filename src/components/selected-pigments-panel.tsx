import type { PigmentSelectionState, PigmentSlot } from "../lib/pigments";
import { otherSlot } from "../lib/pigments";

interface SelectedPigmentsPanelProps {
  pigments: PigmentSelectionState;
  activeSlot: PigmentSlot;
  onSetActive: (slot: PigmentSlot) => void;
  onRemove: (slot: PigmentSlot) => void;
  onSwap: () => void;
}

export function SelectedPigmentsPanel({
  pigments,
  activeSlot,
  onSetActive,
  onRemove,
  onSwap,
}: SelectedPigmentsPanelProps) {
  return (
    <div className="selected-pigments">
      <div className="selected-pigments__header">
        <div>
          <p className="eyebrow">Selected Pigments</p>
          <h3>Blend overview</h3>
        </div>
        <button
          className="pill-button"
          disabled={!(pigments.A && pigments.B)}
          onClick={onSwap}
          type="button"
        >
          Swap A ↔ B
        </button>
      </div>

      <div className="selected-pigments__list">
        {(Object.keys(pigments) as PigmentSlot[]).map((slot) => {
          const pigment = pigments[slot];
          return (
            <article
              className={`selected-pigment ${activeSlot === slot ? "selected-pigment--active" : ""}`}
              key={slot}
            >
              <header>
                <span className="selected-pigment__slot">Pigment {slot}</span>
                <div className="selected-pigment__actions">
                  <button
                    className="text-button"
                    onClick={() => onSetActive(slot)}
                    type="button"
                  >
                    {activeSlot === slot ? "Active" : "Set active"}
                  </button>
                  <button
                    className="text-button text-button--danger"
                    onClick={() => onRemove(slot)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </header>

              {pigment ? (
                <div className="selected-pigment__body">
                  <span
                    className="selected-pigment__swatch"
                    style={{ backgroundColor: pigment.hex }}
                  />
                  <div>
                    <p className="selected-pigment__name">{pigment.name}</p>
                    <p className="selected-pigment__meta">
                      {pigment.description}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="selected-pigment__placeholder">
                  Slot empty. Choose a pigment for slot {slot} to mix with
                  Pigment {otherSlot(slot)}.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
