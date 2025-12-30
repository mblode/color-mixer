import type { WebGPUCapabilityResult } from "../lib/webgpu";

const STATUS_LABEL: Record<WebGPUCapabilityResult["status"], string> = {
  checking: "Checking WebGPU...",
  supported: "WebGPU ready",
  unsupported: "WebGPU unavailable",
};

export interface WebGPUStatusProps {
  result: WebGPUCapabilityResult;
}

export function WebGPUStatus({ result }: WebGPUStatusProps) {
  return (
    <div
      aria-live="polite"
      className={`webgpu-status webgpu-status--${result.status}`}
    >
      <span className="webgpu-status__label">
        {STATUS_LABEL[result.status]}
      </span>
      {result.message ? (
        <span className="webgpu-status__message">{result.message}</span>
      ) : null}
    </div>
  );
}
