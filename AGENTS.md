# Repository Guidelines

## Project Structure & Module Organization
- Root app: `index.html`, `src/` (entry `src/editor.ts`, examples under `src/examples/`).
- Packages (Nx workspaces): `packages/*` plus nested libs (e.g., `editor`, `compiler`, `editor/packages/glugglug`, `editor/packages/sprite-generator`). Each builds to its own `dist/` directory under the package root.
- Builds: Vite outputs to `dist/` (root). Package bundles are consumed via aliases like `@8f4e/editor`.
- Docs and assets: `docs/`, selected files copied via Vite static-copy.
- Nested `AGENTS.md` files exist in some packages to provide package-specific guidance; they extend (and may override) this root file for their scope.

## Build, Test, and Development Commands
- `npm run dev`: Watches `packages/editor` and starts Vite on `http://localhost:3000`.
- `npm run build`: Builds all Nx packages, then Vite production build to `dist/`.
- `npm run test`: Runs Vitest for all packages via Nx.
- `npm run typecheck`: Type-checks all packages. Runs on pre-commit via Husky/lint-staged and in CI on push/PR to main and staging.
- `npm run lint`: ESLint with autofix; also runs on pre-commit via Husky/lint-staged.
- `npm run graph`: Opens Nx project dependency graph.

## Comment & Documentation Style
- Do not add inline implementation comments inside code (e.g. trailing `//` remarks or per-line explanations).
- You may add or update JSDoc-style comments for functions, classes, and modules when they improve clarity.
- Prefer expressing intent via JSDoc and clear naming rather than scattered inline comments.

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules). Target: modern browsers/node.
- Formatting: Prettier (tabs, single quotes, semi, trailing commas, width 120).
- Linting: ESLint (`eslint:recommended`, `@typescript-eslint`, `import/order`).
- Imports: Prefer workspace aliases `@8f4e/<package>`.
- Files/dirs: kebab-case for packages, `.ts` for sources; keep `src/` clean and cohesive by domain.

## Testing Guidelines
- Framework: Vitest with built-in ESM support and first-class Vite integration.
- Locations: `**/__tests__/**` or `*.test.ts` / `*.spec.ts` alongside sources.
- Run: `npm test` (all) or `npx vitest` inside a package.
- Configuration: Shared preset at `vitest.preset.ts`, per-package configs in `vitest.config.ts`.
- Globals: Vitest globals enabled (`describe`, `it`, `expect`, `vi` for mocks/spies).
- Aim for meaningful unit tests around compiler/editor logic; snapshot tests OK for view models. Keep tests fast; no browser required.
- Note: The `glugglug` submodule still uses Jest and maintains its own test configuration.

## Commit & Pull Request Guidelines
- Commits: Imperative mood, concise scope (e.g., "editor: fix drag selection"). Reference issues (`#123`) when relevant.
- PRs: Include summary, rationale, and test notes; link issues; add screenshots/gifs for UI/editor changes; update `docs/` when behavior or APIs change.

## Security & Configuration Tips
- Node: use `nvm use` (repo uses `v22.15.1`).
- Dev server: Vite sets COOP/COEP headers; prefer running only one instance on port `3000`.
- Verify aliases resolve to built outputs: run package `build` before `vite build` when changing package APIs.

## Maintenance Note
- When changing tooling (e.g. build/test commands, Nx targets), remember to update relevant `AGENTS.md` files.
- Nested `AGENTS.md` files in packages should stay in sync with root guidance; update them when workflows or conventions change.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->