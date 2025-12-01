# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-web-worker-logic`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-web-worker-logic`.

## Build, Test, Dev
- From root: `npx nx run runtime-web-worker-logic:build|test|typecheck`.
- From package directory: use `npx nx run runtime-web-worker-logic:<target>` (e.g., `npx nx run runtime-web-worker-logic:dev`).

## Coding Style
- TypeScript + ESLint + Prettier (repo defaults). Avoid DOM APIs in worker code.

## Testing
- Vitest (via Nx). Test message handling and utilities; mock `postMessage`.

## Commits & PRs
- Commits: `runtime-web-worker-logic: <change>`; PRs describe protocol changes.
