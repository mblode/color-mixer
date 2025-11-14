import type { WebGPUCapabilityResult } from '../lib/webgpu'

const STATUS_LABEL: Record<WebGPUCapabilityResult['status'], string> = {
  checking: 'Checking WebGPU...',
  supported: 'WebGPU ready',
  unsupported: 'WebGPU unavailable',
}

export interface WebGPUStatusProps {
  result: WebGPUCapabilityResult
}

export function WebGPUStatus({ result }: WebGPUStatusProps) {
  return (
    <section className={`webgpu-status webgpu-status--${result.status}`} aria-live="polite">
      <p className="webgpu-status__label">{STATUS_LABEL[result.status]}</p>
      {result.message ? <p className="webgpu-status__message">{result.message}</p> : null}
    </section>
  )
}
