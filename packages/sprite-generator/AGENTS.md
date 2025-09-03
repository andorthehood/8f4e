# Repository Guidelines

## Package Scope & Layout
- Path: `packages/sprite-generator`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/sprite-generator`.

## Build, Test, Dev
- From root: `npx nx run sprite-generator:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test` (may be `--passWithNoTests`), `npm run typecheck`.

## Coding Style
- TypeScript; ESLint + Prettier per root config. Keep pure, deterministic functions.

## Testing
- Jest with `@swc/jest`. Prefer unit tests and golden/snapshot tests for outputs.

## Commits & PRs
- Commits: `sprite-generator: <change>`; PRs include rationale and test notes.
