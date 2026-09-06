# Repository Guidelines

## Package Scope & Layout
- Path: `packages/editor/packages/editor-core`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/editor-core`. Consumed by the default editor composition and runtime definitions.

## Build, Bundle, Dev
- From root: `npx nx run @8f4e/editor-core:build|test|typecheck`.
- From package directory: use `npx nx run @8f4e/editor-core:<target>` (e.g., `npx nx run @8f4e/editor-core:dev`).
- Ensure `dist/` exists before building the default editor composition after API changes.
- The nested `editor-state` library builds `index` and `serializeTo8f4e` entries. Keep the formatter entry separate so
  the synchronous public re-export can be tree-shaken while export handlers dynamically load it. Validate this in
  the final editor-website build; a single library entry folds the formatter back into startup code.

## Coding Style
- TypeScript (ESM). Use Biome as the fixer (`npx biome check --write <files>`); it owns formatting and import organization.
- Prefer alias imports for internal packages.

## Testing
- Vitest (via Nx). Tests under `__tests__` or `*.test.ts`.
- Favor unit tests for view-models and utilities; snapshot tests acceptable.

## Commits & PRs
- Commits: `editor: <change>` (e.g., `editor: fix drag selection`).
- PRs: add screenshots/gifs for UI changes, include test notes, link issues.
