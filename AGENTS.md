# Repository Guidelines

## Overview

This repo is a Vite + React + TypeScript playground for a WebGPU pigment mixer. Expect UI work in React, Mixbox pigment utilities in `src/lib`, and GPU simulation code in `src/simulation` and `src/shaders`.

## Project Structure & Module Organization

- `src/`: application code.
  - `app.tsx`/`main.tsx`: app shell and entry.
  - `components/`: React UI (kebab-case files, PascalCase exports).
  - `lib/`: shared utilities (Mixbox, WebGPU checks, palettes).
  - `simulation/` + `shaders/`: WebGPU/TypeGPU logic and WGSL.
  - `types/`: shared TypeScript types.
  - `style.css`: global styles (BEM-ish class names like `app__header`).
- `public/`: static assets served by Vite.
- `dist/`: production build output.
- Root configs: `vite.config.ts`, `tsconfig.json`, `biome.jsonc`.

## Build, Test, and Development Commands

- `npm install`: install dependencies (Node 22+, npm 10+).
- `npm run dev`: start Vite dev server (HMR).
- `npm run build`: type-check (`tsc`) and build to `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run Biome checks.
- `npm run format` / `npm run lint:fix`: auto-format via Biome/Ultracite.
- `npm run test`: run Vitest in watch mode (`npm run test -- --run` for one-shot).
- `npm run check-types`: TypeScript type check only.

## Coding Style & Naming Conventions

- TypeScript + React; prefer functional components and hooks.
- Formatting/linting: Biome with Ultracite preset (`biome.jsonc`).
- File naming: kebab-case for component files (e.g., `pigment-controls.tsx`).
- Component names: PascalCase; variables/functions: camelCase.
- CSS uses BEM-style class names (`block__element`).

## Testing Guidelines

- Framework: Vitest.
- Test files: `*.test.ts` (example: `src/lib/mixbox.test.ts`).
- No stated coverage target; add tests for new logic in `lib/` and simulation helpers.

## Commit & Pull Request Guidelines

- Commit history is terse and single-line (e.g., “Save”, “seo”); keep subjects short and descriptive.
- PRs should include: a brief summary, testing notes (commands run), and screenshots or recordings for UI changes.
- Note WebGPU-specific behavior or browser flags if relevant to the change.

## Tooling Notes

- Husky pre-commit runs `npm test` and formats staged files with Ultracite (`npx ultracite fix`). Ensure tests pass before committing.
