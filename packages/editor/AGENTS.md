# Repository Guidelines

## Package Scope & Layout
- Path: `packages/editor`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/editor`. Consumed by the root Vite app.

## Build, Bundle, Dev
- From root: `npx nx run editor:build|bundle|test|typecheck`.
- From package directory: use `npx nx run editor:<target>` (e.g., `npx nx run editor:dev`).
- Ensure `dist/` exists before root `vite build` after API changes.

## Coding Style
- TypeScript (ESM). ESLint (`@typescript-eslint`, `import/order`). Prettier defaults (tabs, single quotes, semi, width 120).
- Prefer alias imports for internal packages.

## Testing
- Vitest (via Nx). Tests under `__tests__` or `*.test.ts`.
- Favor unit tests for view-models and utilities; snapshot tests acceptable.

## Commits & PRs
- Commits: `editor: <change>` (e.g., `editor: fix drag selection`).
- PRs: add screenshots/gifs for UI changes, include test notes, link issues.
