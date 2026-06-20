# Repository Guidelines

## Overview

This repo is a Next.js + React + TypeScript playground for a WebGPU pigment mixer. Expect UI work in React, Mixbox pigment utilities in `lib`, and GPU simulation code in `simulation` and `shaders`.

## Project Structure & Module Organization

- `app/`: Next.js App Router files (`layout.tsx`, `page.tsx`, global CSS).
- `color-mixer-app.tsx`: client-side app shell.
- `components/`: React UI (kebab-case files, PascalCase exports).
- `lib/`: shared utilities (Mixbox, WebGPU checks, palettes).
- `simulation/` + `shaders/`: WebGPU/TypeGPU logic and WGSL.
- `brush/`: brush stroke modelling and tests.
- `types/`: shared TypeScript declarations.
- `public/`: static assets served by Next.js.
- `.next/`: local Next.js build output.
- Root configs: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `oxlint.config.ts`, `oxfmt.config.ts`.

## Build, Test, and Development Commands

- `npm install`: install dependencies (Node 22+, npm 10+).
- `npm run dev`: start the Next.js dev server.
- `npm run build`: build the Next.js production app.
- `npm run start`: serve the production build locally after `npm run build`.
- `npm run preview`: alias for `npm run start`.
- `npm run lint`: run Oxlint.
- `npm run format` / `npm run lint:fix`: auto-format via Ultracite/Oxfmt/Oxlint.
- `npm run test`: run Vitest in watch mode (`npm run test -- --run` for one-shot).
- `npm run check-types`: TypeScript type check only.

## Coding Style & Naming Conventions

- TypeScript + React; prefer functional components and hooks.
- Formatting/linting: Ultracite with Oxlint and Oxfmt.
- File naming: kebab-case for component files (e.g., `pigment-controls.tsx`).
- Component names: PascalCase; variables/functions: camelCase.
- CSS uses BEM-style class names (`block__element`).

## Testing Guidelines

- Framework: Vitest.
- Test files: `*.test.ts` (example: `lib/pigments.test.ts`).
- No stated coverage target; add tests for new logic in `lib/` and simulation helpers.

## Commit & Pull Request Guidelines

- Commit history is terse and single-line (e.g., “Save”, “seo”); keep subjects short and descriptive.
- PRs should include: a brief summary, testing notes (commands run), and screenshots or recordings for UI changes.
- Note WebGPU-specific behavior or browser flags if relevant to the change.

## Tooling Notes

- Lefthook pre-commit runs `npx ultracite fix` on staged JS/TS/JSON/CSS files. Ensure tests pass before committing.
