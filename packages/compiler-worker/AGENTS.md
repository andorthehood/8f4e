# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler-worker`; source in `src/`, output in `dist/`.
- Consumed via alias `@8f4e/compiler-worker` or by the editor package.

## Build, Test, Dev
- From root: `npx nx run compiler-worker:build|test|typecheck`.
- From package directory: use `npx nx run compiler-worker:<target>` (e.g., `npx nx run compiler-worker:dev`).

## Coding Style
- TypeScript; ESLint with repo rules, Prettier formatting.
- Keep worker boundaries explicit; prefer message types in a shared module.

## Testing
- Jest with `@swc/jest`. Test message handling and compile orchestration with unit tests.

## Commits & PRs
- Commits: `compiler-worker: <change>`; PRs describe protocol changes and include tests.
