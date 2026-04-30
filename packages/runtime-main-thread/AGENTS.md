# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-main-thread`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-main-thread`.

## Build, Test, Dev
- From root: `npx nx run runtime-main-thread:build|test|typecheck`.
- From package directory: use `npx nx run runtime-main-thread:<target>` (e.g., `npx nx run runtime-main-thread:dev`).

## Coding Style
- TypeScript strict. Use ESLint as the fixer (`npx eslint --fix <files>`) per root config.
- Keep browser-side logic separated from worker/audio code paths.

## Testing
- Vitest (via Nx). Unit tests only; mock timers and postMessage as needed.

## Commits & PRs
- Commits: `runtime-main-thread: <change>`; PRs document behavior changes and link issues.
