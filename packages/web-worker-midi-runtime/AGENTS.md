# Repository Guidelines

## Package Scope & Layout
- Path: `packages/web-worker-midi-runtime`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/web-worker-midi-runtime` (if applicable) or consumed by other packages.

## Build, Test, Dev
- From root: `npx nx run web-worker-midi-runtime:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test` (may be `--passWithNoTests`), `npm run typecheck`.

## Coding Style
- TypeScript; ESLint/Prettier per repo. Keep worker logic message-driven and deterministic.

## Testing
- Jest with `@swc/jest`. Unit tests for MIDI event handling; mock timers.

## Commits & PRs
- Commits: `web-worker-midi-runtime: <change>`; PRs include rationale and tests.
