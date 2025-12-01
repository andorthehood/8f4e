# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-main-thread-logic`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-main-thread-logic`.

## Build, Test, Dev
- From root: `npx nx run runtime-main-thread-logic:build|bundle|test|typecheck`.
- From package directory: use `npx nx run runtime-main-thread-logic:<target>` (e.g., `npx nx run runtime-main-thread-logic:dev`).

## Coding Style
- TypeScript strict. ESLint rules and Prettier per root config.
- Keep browser-side logic separated from worker/audio code paths.

## Testing
- Vitest (via Nx). Unit tests only; mock timers and postMessage as needed.

## Commits & PRs
- Commits: `runtime-main-thread-logic: <change>`; PRs document behavior changes and link issues.
