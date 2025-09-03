# Repository Guidelines

## Package Scope & Layout
- Path: `packages/2d-engine`; source in `src/`, output in `dist/` (ES modules).
- Consumed via workspace alias `@8f4e/2d-engine` after build.

## Build, Test, Dev
- From root: `npx nx run 2d-engine:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test` (may be `--passWithNoTests`), `npm run typecheck`.
- Output: `dist/` artifacts referenced by Vite aliases in the root app.

## Coding Style
- TypeScript, strict mode. ESLint + `@typescript-eslint` with `import/order`.
- Prettier: tabs, single quotes, semicolons, width 120, trailing commas.
- Prefer alias imports `@8f4e/<pkg>` for workspace modules.

## Testing
- Jest with `@swc/jest`. Test files under `**/__tests__/**` or `*.test.ts`.
- Keep tests fast and unit-scoped; no browser required.

## Commits & PRs
- Commits: imperative, scoped (e.g., `2d-engine: add sprite util`).
- PRs: include summary, rationale, and test notes; link issues.
