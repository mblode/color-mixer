import type { PigmentMixResult } from "../lib/mixbox";
import type { PigmentSelectionState } from "../lib/pigments";

interface PigmentMixPreviewProps {
  pigments: PigmentSelectionState;
  mixResult: PigmentMixResult | null;
}

export function PigmentMixPreview({
  pigments,
  mixResult,
}: PigmentMixPreviewProps) {
  const hasBothPigments = Boolean(pigments.A && pigments.B);

  return (
    <div className="mix-preview">
      <div className="mix-preview__header">
        <div>
          <p className="eyebrow">Mixbox Preview</p>
          <h3>Live pigment blend</h3>
        </div>
        <span className="mix-preview__license">
          Mixbox © Secret Weapons · CC BY-NC 4.0
        </span>
      </div>

      {hasBothPigments && mixResult ? (
        <div className="mix-preview__body">
          <div
            className="mix-preview__swatch"
            style={{ backgroundColor: mixResult.hex }}
          />
          <div className="mix-preview__details">
            <p className="mix-preview__hex">{mixResult.hex}</p>
            <p className="mix-preview__rgb">RGB {mixResult.rgb.join(", ")}</p>
            <p className="mix-preview__ratio">
              {pigments.A?.name} {Math.round(mixResult.ratioA * 100)}% ·{" "}
              {pigments.B?.name} {Math.round(mixResult.ratioB * 100)}%
            </p>
          </div>
        </div>
      ) : (
        <p className="mix-preview__placeholder">
          Select pigments A and B to preview their Mixbox blend.
        </p>
      )}
    </div>
  );
}
