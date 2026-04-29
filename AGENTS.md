# Repository Guidelines

## Project Structure & Module Organization
- Root app: `index.html`, `src/` (entry `src/editor.ts`, examples under `src/examples/`).
- Packages (Nx workspaces): `packages/*` plus nested libs (e.g., `editor`, `compiler`, `editor/packages/glugglug`, `editor/packages/sprite-generator`). Each builds to its own `dist/` directory under the package root.
- Builds: Vite outputs to `dist/` (root). Package bundles are consumed via aliases like `@8f4e/editor`.
- Docs and assets: `docs/`, selected files copied via Vite static-copy.
- Nested `AGENTS.md` files exist in some packages to provide package-specific guidance; they extend (and may override) this root file for their scope.

## Build, Test, and Development Commands (Nx-first)
- `npx nx run app:dev`: Builds packages (watch) and starts Vite dev server on `http://localhost:3000`.
- `npx nx run app:serve`: Serves the production build via `vite preview`.
- `npx nx run app:build`: Vite production build to `dist/` for the root app.
- `npx nx run-many --target=build --all`: Build all packages/libs.
- `npx nx run-many --target=test --all`: Run Vitest across all packages.
- `npx nx run-many --target=typecheck --all`: Type-check all packages; also run on pre-commit via Husky/lint-staged.
- `npx nx run app:lint`: ESLint for the root app. Use `run-many --target=lint --all` to lint all projects if needed.
- `npx nx graph`: Open Nx project dependency graph.
- `npx nx run app:kill-dev`: Kill any dev server on port 3000.

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules). Target: modern browsers/node.
- Formatting/linting: use ESLint as the fixer (`npx eslint --fix <files>`). ESLint owns the repo formatting rules (tabs, single quotes, semicolons, trailing commas, width 120); do not run standalone formatters.
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
- Commit messages: Use Conventional Commits.
- Features: `feat(package-name): <summary>` for package-specific changes, or `feat: <summary>` for non-package-specific changes.
- Fixes: `fix(package-name): <summary>` for package-specific changes, or `fix: <summary>` for non-package-specific changes.
- Release semantics are driven by Conventional Commits: `fix` triggers a patch release, `feat` triggers a minor release, and breaking changes (`!` or `BREAKING CHANGE`) trigger a major release. Nx release also bumps dependent packages automatically.
- For refactors, cleanup, dependency updates, and other maintenance that should be released, use `fix(...)` unless the change is truly feature-level.
- Use `chore(...)` only for work that should not cause a package release, such as repository maintenance with no shipped package impact.
- Use a non-release `chore(...)` scope, such as `chore(ci): ...` or `chore(tooling): ...`, for release workflow/configuration-only changes unless the change should intentionally release packages.
- Documentation-only changes: `docs: <summary>` or `docs(scope): <summary>`. These should not cause package releases.
- Generated release commits use `chore(release): ...`; do not use that scope for hand-written maintenance commits.
- PRs: Include summary, rationale, and test notes; link issues; add screenshots/gifs for UI/editor changes; update `docs/` when behavior or APIs change.

## Security & Configuration Tips
- Node: use `nvm use` (repo uses `v22.15.1`).
- Dev server: Vite sets COOP/COEP headers; prefer running only one instance on port `3000`.
- Verify aliases resolve to built outputs: run package `build` before `vite build` when changing package APIs.

## Maintenance Note
- When changing tooling (e.g. build/test commands, Nx targets), remember to update relevant `AGENTS.md` files.
- Nested `AGENTS.md` files in packages should stay in sync with root guidance; update them when workflows or conventions change.

## Compiler Error Domains
The compiler has two separate error systems in `packages/compiler/src/`. Choose the correct one based on **detection phase**:

- **Syntax errors** (`packages/compiler/src/syntax/syntaxError.ts` — `SyntaxRulesError` / `SyntaxErrorCode`):
  Use when the error can be detected from token or argument shape alone, **before** any semantic context is built.
  Examples: malformed literals, missing required argument shape, invalid pointer-depth syntax, invalid string encoding.

- **Compiler (semantic) errors** (`packages/compiler/src/compilerError.ts` — `ErrorCode` / `getError`):
  Use when detecting the error requires symbol resolution, scope, stack state, type checking, or other compiler state.
  Examples: undeclared identifier, type mismatch, stack mismatch, illegal memory access, duplicate declarations.

**Decision rule**: if the error can be detected before building semantic context → syntax error; otherwise → compiler error.
Each error code owns its default message in its central registry; throw sites should omit the message argument unless they need to add dynamic context.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
