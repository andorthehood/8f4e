# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-web-worker-midi`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-web-worker-midi`.

## Build, Test, Dev
- From root: `npx nx run runtime-web-worker-midi:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test`, `npm run typecheck`.

## Coding Style
- TypeScript with ESLint/Prettier. Keep worker code pure and messages versioned.

## Testing
- Jest with `@swc/jest`. Unit test MIDI message parsing and routing; mock timers.

## Commits & PRs
- Commits: `runtime-web-worker-midi: <change>`; PRs link issues and document behavior changes.
