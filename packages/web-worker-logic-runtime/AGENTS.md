# Repository Guidelines

## Package Scope & Layout
- Path: `packages/web-worker-logic-runtime`; source in `src/`, output in `dist/`.
- Alias: `@8f4e/web-worker-logic-runtime` (if applicable) or consumed by other packages.

## Build, Test, Dev
- From root: run `npx nx run web-worker-logic-runtime:build|test|typecheck`.
- From package: `npm run build`, `npm run dev`, `npm run test` (may be `--passWithNoTests`), `npm run typecheck`.

## Coding Style
- TypeScript; ESLint/Prettier per repo. Avoid DOM APIs; design for worker constraints.

## Testing
- Jest with `@swc/jest`. Unit-test utilities and message handling with mocks.

## Commits & PRs
- Commits: `web-worker-logic-runtime: <change>`; PRs describe protocol changes.
