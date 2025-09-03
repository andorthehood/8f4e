# Repository Guidelines

## Package Scope & Layout
- Path: `packages/audio-worklet-runtime`; source in `src/`, output in `dist/`.
- Published as ESM; consumed via `@8f4e/runtime-audio-worklet` alias in the app.

## Build, Test, Dev
- From root: `npx nx run runtime-audio-worklet:build|test|typecheck`.
- From package: `npm run build` (may use a Vite worklet config), `npm run dev`, `npm run test` (often `--passWithNoTests`), `npm run typecheck`.
- Ensure `dist/` exists before running the root Vite build.

## Coding Style
- TypeScript with ESLint (`@typescript-eslint`, `import/order`). Prettier settings align with the repo.
- Use alias imports for internal deps.

## Testing
- Jest with `@swc/jest`; place tests in `__tests__` or as `*.test.ts`.
- Keep tests isolated from browser APIs; stub where necessary.

## Commits & PRs
- Commits: `runtime-audio-worklet: <change>`. Reference issues when applicable.
- PRs: describe behavior changes and include test notes.
