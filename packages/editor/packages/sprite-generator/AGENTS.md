# Repository Guidelines

## Package Scope & Layout
- Path: `packages/editor/packages/sprite-generator`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/sprite-generator`.

## Build, Test, Dev
- From root: `npx nx run sprite-generator:build|test|typecheck`.
- From package directory: use `npx nx run sprite-generator:<target>` (e.g., `npx nx run sprite-generator:dev`).
- Screenshot tests: `npx nx run sprite-generator:test:screenshot` and variants (:ui, :update, :headed, :debug).

## Coding Style
- TypeScript; ESLint + Prettier per root config. Keep pure, deterministic functions.

## Testing
- Vitest (via Nx). Prefer unit tests and golden/snapshot tests for outputs.
- To update snapshots after intentional changes, use `npx nx run sprite-generator:test -- --update` (or the `:update` variant for screenshot tests).

## Commits & PRs
- Commits: `sprite-generator: <change>`; PRs include rationale and test notes.
