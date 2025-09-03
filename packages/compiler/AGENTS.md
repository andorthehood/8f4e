# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler`.

## Build, Test, Dev
- From root: `npx nx run compiler:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test`, `npm run coverage`, `npm run typecheck`.
- Artifacts in `dist/` must exist before root Vite build when APIs change.

## Coding Style
- TypeScript (strict). ESLint + `@typescript-eslint` and `import/order`.
- Prettier: tabs, single quotes, semi, width 120, trailing commas.

## Testing
- Jest with `@swc/jest`. Place tests in `tests/`, `__tests__/`, or `*.test.ts`.
- Focus on deterministic, fast unit tests for parsing, IR, and transforms.

## Commits & PRs
- Commits: `compiler: <scope> <change>` (e.g., `compiler: parser fix for arrays`).
- PRs: include rationale, test coverage notes, and linked issues.
