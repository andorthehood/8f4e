# Repository Guidelines

## Package Scope & Layout
- Path: `packages/editor/packages/editor-core/packages/web-ui/packages/sprite-generator`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/sprite-generator`.
- Generate complete colored fonts (ASCII and custom glyphs), feedback stars, and solid fill-color sprites here.
- Connector brackets and switch knobs come from font lookups; do not generate dedicated copies of these characters.
- Web-ui composes background tiles, connectors, and switches using the generic `@8f4e/sprite-atlas-extender` package.
  Keep complete icon layouts and their semantic identifiers in web-ui.

## Build, Test, Dev
- From root: `npx nx run @8f4e/sprite-generator:build|test|typecheck`.
- From package directory: use `npx nx run @8f4e/sprite-generator:<target>` (e.g., `npx nx run @8f4e/sprite-generator:dev`).
- Screenshot tests: `npx nx run @8f4e/sprite-generator:test:screenshot` and variants (:ui, :update, :headed, :debug).

## Coding Style
- TypeScript; use Biome as the fixer (`npx biome check --write <files>`) per root config. Keep pure, deterministic functions.

## Testing
- Vitest (via Nx). Prefer unit tests and golden/snapshot tests for outputs.
- To update snapshots after intentional changes, use `npx nx run @8f4e/sprite-generator:test -- --update` (or the `:update` variant for screenshot tests).

## Commits & PRs
- Commits: `sprite-generator: <change>`; PRs include rationale and test notes.
