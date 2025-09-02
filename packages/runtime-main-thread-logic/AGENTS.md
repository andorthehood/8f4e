# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-main-thread-logic`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-main-thread-logic`.

## Build, Test, Dev
- From root: `npx nx run runtime-main-thread-logic:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test` (may pass with no tests), `npm run typecheck`.

## Coding Style
- TypeScript strict. ESLint rules and Prettier per root config.
- Keep browser-side logic separated from worker/audio code paths.

## Testing
- Jest with `@swc/jest`. Unit tests only; mock timers and postMessage as needed.

## Commits & PRs
- Commits: `runtime-main-thread-logic: <change>`; PRs document behavior changes and link issues.
