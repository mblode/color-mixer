# Paint Mixer MVP – Product Requirements

## Objective
Build a React + TypeScript web app that demonstrates realistic pigment mixing on a fluid canvas. Users can pick two pigments, paint on a WebGPU surface, and see colors mix using Mixbox’s pigment model. Keep scope tight: one brush, two pigments at a time, and desktop browsers only.

## Stack & Tooling
- Vite + React + TypeScript for the UI and build tooling.
- Mixbox pigment model (TS/WASM port) for realistic blending.
- TypeGPU + WebGPU for the fluid simulation and rendering.
- Vitest (or lightweight assertions) for color-mix sanity checks.

## Constraints & Out-of-Scope
- Desktop browsers with WebGPU only; mobile/touch optimization deferred.
- No persistence, export, layers, or advanced brush settings.
- One brush mode; eraser, fill, or eyedropper deferred.
- No multi-user features or backend services.

## Phases & Tasks

### Phase 1 – Project Setup (Vite + React + TS)
Goal: scaffold the project, install dependencies, and verify WebGPU access.
- [x] Scaffold a Vite React + TypeScript app and initialize git.
- [x] Install React DOM, Mixbox dependency/port, TypeGPU, and linting/testing basics.
- [x] Organize folders (`components/`, `simulation/`, `shaders/`, `lib/`).
- [x] Add a README covering setup, WebGPU requirements, and npm scripts.
- [x] Implement a minimal WebGPU capability check with a user-facing fallback message.
- [x] Run `npm run dev` to confirm hot reload and baseline rendering.

### Phase 2 – Pigment Selection UI
Goal: allow users to pick and manage two pigments with simple controls.
- [x] Define a preset pigment palette sourced from Mixbox pigment data (name + swatch + metadata).
- [x] Build two selector components (A/B) with swatches, labels, and active state highlighting.
- [x] Let users toggle the active painting pigment and optionally adjust a ratio slider (0‑100%).
- [x] Show a “selected pigments” panel with quick remove/swap actions.
- [x] Ensure the layout keeps controls beside the canvas on desktop resolutions.

### Phase 3 – Mixbox Color Logic
Goal: wire realistic color math into the UI for immediate feedback.
- [x] Import or port the Mixbox mixing routine (CPU-side) with clear TypeScript typings.
- [x] Implement `mixPigments(pigments: Pigment[], ratios: number[]): RGB` returning an sRGB preview.
- [x] Display a live “mixed swatch” that updates whenever selections or ratios change.
- [x] Add lightweight tests/console checks for canonical mixes (e.g., yellow + blue ≈ green).
- [x] Document Mixbox licensing (CC BY-NC 4.0) in README and UI footer.

### Phase 4 – WebGPU Canvas & Fluid Core
Goal: render a fluid canvas that supports injection of pigment density.
- [x] Mount a `<canvas>` element, request a WebGPU adapter/device via TypeGPU, and size it responsively.
- [x] Allocate simulation textures/buffers (velocity, pressure, divergence, pigment density) with ping-pong pairs.
- [x] Implement compute pipelines for advection, diffusion, external forces, pressure solve, and pigment transport.
- [x] Add a render pipeline (fullscreen quad) that visualizes pigment density (temporary grayscale OK).
- [x] Hook pointer/mouse events to inject velocity and pigment where the brush moves.
- [x] Drive the simulation with `requestAnimationFrame`, ensuring UI thread responsiveness.

### Phase 5 – Realistic Color Mixing on the Canvas
Goal: display true pigment colors inside the fluid simulation.
- [x] Store per-pigment concentration fields (two pigments for MVP) in the simulation textures.
- [x] Convert selected pigments to Mixbox latent vectors on the CPU and pass them to shaders as uniforms.
- [x] Update render shader to mix latent values per pixel and output sRGB, matching the CPU-driven preview.
- [x] Sync the React pigment state (active slot + ratio) with the brush uniforms so GPU and UI stay aligned.
- [x] Add UI controls for pause/resume, clear canvas, and short usage instructions.
- [x] Provide a clearer “WebGPU unavailable” screen with actionable guidance.

### Phase 6 – Testing & Launch Readiness
Goal: validate behavior, performance, and ship the MVP.
- [ ] Manually test in Chromium-based browsers (Chrome, Edge) and Safari TP if available.
- [ ] Compare fully mixed canvas colors with the static Mixbox preview to ensure parity.
- [ ] Tune simulation resolution/iterations to sustain ~60 FPS on reference hardware.
- [x] Run lint/tests, then `npm run build` to confirm the production bundle works.
- [ ] Update README with usage instructions, attribution, and deployment notes (e.g., Vercel/GitHub Pages).

## Deliverable
A single-page React app (served via Vite) where users choose two pigments, paint on a WebGPU canvas, and watch colors mix realistically. The MVP ends once the painting experience feels fluid, accurate, and responsive with the constraints above.

## Progress Tracking

### Current Status
**Phase 1 – Project Setup** ✓ Complete
- [x] Scaffold a Vite React + TypeScript app and initialize git
- [x] Basic project structure established
- [x] Install React DOM, Mixbox dependency/port, TypeGPU, and linting/testing basics
- [x] Organize folders (`components/`, `simulation/`, `shaders/`, `lib/`)
- [x] Add a README covering setup, WebGPU requirements, and npm scripts
- [x] Implement a minimal WebGPU capability check with a user-facing fallback message
- [x] Run `npm run dev` to confirm hot reload and baseline rendering

**Phase 2 – Pigment Selection UI** ✓ Complete
- [x] Mixbox-aligned preset palette with metadata + swatches
- [x] Dual selector components with active-state toggles and desktop-friendly layout
- [x] Blend ratio slider plus selected pigments panel for swap/remove flows

**Phase 3 – Mixbox Color Logic** ✓ Complete
- [x] Standalone Mixbox helper with TypeScript typings
- [x] Live pigment swatch + ratio-aware preview component
- [x] Vitest coverage for pigment mixing edge cases + yellow/blue sanity checks

**Phase 4 – WebGPU Canvas & Fluid Core** ✓ Complete
- [x] TypeGPU device bootstrap + responsive `<canvas>` mounting
- [x] Ping-pong pigment textures with multi-pass compute pipelines
- [x] Pointer-driven injection feeding a fullscreen render pass

**Phase 5 – Realistic Color Mixing** ✓ Complete
- [x] Stored per-pigment concentration data and Mixbox latents per texel
- [x] WGSL render mix that reconstructs sRGB via Mixbox polynomials
- [x] Pause/resume + clear controls plus improved WebGPU fallback guidance

### Next Steps
1. Kick off Phase 6 validation: run cross-browser checks and compare canvas mixes with the Mixbox panel.
2. Tune simulation performance/quality (resolution, workgroup sizes) for steady 60 FPS on reference hardware.
3. Add final documentation (deployment, attribution) and wire up `npm run build` to CI prior to release.

### Dependencies to Install
```bash
npm install react react-dom mixbox typegpu
npm install -D @types/react @types/react-dom @vitejs/plugin-react
npm install -D vitest @vitest/ui
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin globals @webgpu/types
```

### Recommended Folder Structure
```
src/
├── components/        # React UI components
│   ├── PigmentSelector.tsx
│   ├── Canvas.tsx
│   └── Controls.tsx
├── simulation/        # Fluid simulation logic
│   ├── webgpu.ts
│   ├── fluid.ts
│   └── types.ts
├── shaders/          # WebGPU shader code
│   ├── advection.wgsl
│   ├── pressure.wgsl
│   └── render.wgsl
├── lib/              # Utilities & Mixbox integration
│   ├── mixbox.ts
│   └── pigments.ts
├── App.tsx
└── main.tsx
```
