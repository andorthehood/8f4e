# Repository Guidelines

## Package Scope & Layout
- Path: `packages/runtime-audio-worklet`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/runtime-audio-worklet` for the app/editor.

## Build, Test, Dev
- From root: `npx nx run runtime-audio-worklet:build|test|typecheck`.
- From package: `npm run build` (worklet Vite config), `npm run dev`, `npm run test` (`--passWithNoTests` acceptable), `npm run typecheck`.
- Build before integrating in root Vite to ensure alias resolution.

## Coding Style
- TypeScript. ESLint + Prettier (tabs, single quotes, semi, width 120).
- Keep worklet entrypoints small and dependency-free; avoid DOM APIs.

## Testing
- Jest (`@swc/jest`). Unit-test helpers; integration tests can mock AudioWorklet.

## Commits & PRs
- Commits: `runtime-audio-worklet: <change>`; PRs should describe audio thread implications.
