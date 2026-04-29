# Repository Guidelines

## Package Scope & Layout
- Path: `packages/editor`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/editor`. Consumed by the root Vite app.

## Build, Bundle, Dev
- From root: `npx nx run editor:build|test|typecheck`.
- From package directory: use `npx nx run editor:<target>` (e.g., `npx nx run editor:dev`).
- Ensure `dist/` exists before root `vite build` after API changes.

## Coding Style
- TypeScript (ESM). Use ESLint as the fixer (`npx eslint --fix <files>`); it owns formatting and import-order rules.
- Prefer alias imports for internal packages.

## Testing
- Vitest (via Nx). Tests under `__tests__` or `*.test.ts`.
- Favor unit tests for view-models and utilities; snapshot tests acceptable.

## Commits & PRs
- Commits: `editor: <change>` (e.g., `editor: fix drag selection`).
- PRs: add screenshots/gifs for UI changes, include test notes, link issues.
