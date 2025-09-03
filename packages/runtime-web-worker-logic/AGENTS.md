# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-web-worker-logic`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-web-worker-logic`.

## Build, Test, Dev
- From root: `npx nx run runtime-web-worker-logic:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test`, `npm run typecheck`.

## Coding Style
- TypeScript + ESLint + Prettier (repo defaults). Avoid DOM APIs in worker code.

## Testing
- Jest with `@swc/jest`. Test message handling and utilities; mock `postMessage`.

## Commits & PRs
- Commits: `runtime-web-worker-logic: <change>`; PRs describe protocol changes.
