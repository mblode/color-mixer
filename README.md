# Paint Mixer MVP

A Vite + React + TypeScript playground for building a realistic pigment mixer that pairs Mixbox color math with a WebGPU fluid canvas. The MVP currently provides the project scaffold, dependency stack, and a user-facing WebGPU capability check.

## Current Features

- WebGPU capability detection with guidance when the adapter/device check fails.
- Pigment palette with Mixbox-aligned presets, dual slot selectors, and an active pigment toggle.
- Blend ratio slider (0–100%) plus quick swap/remove controls.
- Live Mixbox preview swatch that reflects the two pigments and current ratio.
- TypeGPU-powered canvas (Phase 4/5) that tracks per-pigment concentrations, mixes Mixbox latent vectors directly in WGSL, offers pause/resume + clear controls, and renders the resulting pigment field every frame.

## Requirements

- Node.js 22+
- npm 10+
- Desktop Chromium or Safari Technology Preview with WebGPU enabled

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Vite dev server (runs on port 5173 or the next open port):
   ```bash
   npm run dev
   ```
3. Open the printed URL in a WebGPU-capable desktop browser.

If WebGPU is unavailable, the UI will display guidance for enabling it. When WebGPU is detected, a placeholder canvas keeps the layout stable until the simulation lands in later phases.

## Available Scripts

- `npm run dev` – Start the Vite development server with hot module replacement.
- `npm run build` – Type-check the project and output a production build.
- `npm run preview` – Preview the production build locally.
- `npm run lint` – Run ESLint with the TypeScript/React ruleset.
- `npm run test` – Start Vitest in watch mode.

## Folder Structure

```
src/
├── App.tsx               # App shell with WebGPU status messaging
├── components/           # React UI building blocks
├── lib/                  # Shared utilities (WebGPU checks, upcoming Mixbox helpers)
├── simulation/           # Fluid + TypeGPU orchestration (placeholder for Phase 4)
├── shaders/              # WGSL shaders (placeholder)
└── style.css             # Global styles
```

## WebGPU Notes

- Chrome/Edge: Visit `chrome://flags` and enable `Unsafe WebGPU`, then restart the browser.
- Safari Technology Preview: Enable WebGPU in **Develop → Experimental Features**.

The WebGPU check is intentionally minimal for Phase 1. It validates `navigator.gpu` and adapter access, then surfaces any issues directly in the UI so users know how to proceed.

## Using the Pigment Controls

1. Pick Pigment A and Pigment B from the palette lists. Each preset includes a swatch plus quick context.
2. Use “Set active” to define which pigment the brush should inject by default.
3. Adjust the ratio slider to prototype pigment balance (disabled until both slots are filled).
4. The Selected Pigments panel offers swap/remove actions, and the Mixbox preview updates in real time as you tweak ratios.

## Painting on the WebGPU Canvas

1. Ensure WebGPU is enabled in your browser (Chrome/Edge `chrome://flags` → “Unsafe WebGPU”, Safari TP → Develop → Experimental Features → WebGPU).
2. With pigments selected, hover over the canvas—status/metrics are shown beneath it.
3. Press and drag to inject the active pigment. The blend ratio + Mixbox preview inform what the brush deposits, and the compute pipelines advect/diffuse it every frame.
4. Use the Pause/Resume and Clear buttons beneath the canvas to inspect a frozen frame or reset the field.
5. Release the pointer (or leave the canvas) to stop injecting pigment. Resize the window to watch the canvas reallocate textures via the TypeGPU-managed device.

## Launch Readiness Checklist

Before shipping, exercise the project in a few environments and ensure the build artifacts are healthy:

1. **Automated checks**
   ```bash
   npm run lint
   npm run test -- --run
   npm run build
   ```
2. **Manual runs**
   - Chrome/Edge (latest): confirm WebGPU flag is enabled, paint with both pigments, verify the Mixbox preview matches the canvas color when the brush ratio is 0%, 50%, and 100%.
   - Safari Technology Preview: enable WebGPU in Develop → Experimental Features, repeat the pigment tests.
   - Resize the window and toggle Pause/Clear to confirm textures reallocate and the simulation resumes cleanly.
3. **Performance sanity**
   - Watch the status panel for frame-time spikes; if the FPS dips on reference hardware, reduce the texture resolution or workgroup size in `FluidSimulation`.

## Mixbox License

Mixbox is © Secret Weapons and distributed under the [Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/) license. This project surfaces that attribution in the UI footer and keeps usage non-commercial, per the license requirements.
