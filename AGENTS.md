# Repository Guidelines

## Project Structure & Module Organization
- Root app: `index.html`, `src/` (entry `src/editor.ts`, examples under `src/examples/`).
- Packages (Nx workspaces): `packages/*` plus nested libs (e.g., `editor`, `compiler`, `editor/packages/glugglug`, `editor/packages/sprite-generator`). Each builds to its own `dist/` directory under the package root.
- Builds: Vite outputs to `dist/` (root). Package bundles are consumed via aliases like `@8f4e/editor`.
- Docs and assets: `docs/`, selected files copied via Vite static-copy.

## Build, Test, and Development Commands
- `npm run dev`: Watches `packages/editor` and starts Vite on `http://localhost:3000`.
- `npm run build`: Builds all Nx packages, then Vite production build to `dist/`.
- `npm run test`: Runs Jest for all packages via Nx.
- `npm run typecheck`: Type-checks all packages.
- `npm run lint`: ESLint with autofix; also runs on pre-commit via Husky/lint-staged.
- `npm run graph`: Opens Nx project dependency graph.

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules). Target: modern browsers/node.
- Formatting: Prettier (tabs, single quotes, semi, trailing commas, width 120).
- Linting: ESLint (`eslint:recommended`, `@typescript-eslint`, `import/order`).
- Imports: Prefer workspace aliases `@8f4e/<package>`.
- Files/dirs: kebab-case for packages, `.ts` for sources; keep `src/` clean and cohesive by domain.

## Testing Guidelines
- Framework: Jest with `@swc/jest` transform.
- Locations: `**/__tests__/**` or `*.test.ts` / `*.spec.ts` alongside sources.
- Run: `npm test` (all) or `npm run test` inside a package.
- Aim for meaningful unit tests around compiler/editor logic; snapshot tests OK for view models. Keep tests fast; no browser required.

## Commit & Pull Request Guidelines
- Commits: Imperative mood, concise scope (e.g., "editor: fix drag selection"). Reference issues (`#123`) when relevant.
- PRs: Include summary, rationale, and test notes; link issues; add screenshots/gifs for UI/editor changes; update `docs/` when behavior or APIs change.

## Security & Configuration Tips
- Node: use `nvm use` (repo uses `v22.15.1`).
- Dev server: Vite sets COOP/COEP headers; prefer running only one instance on port `3000`.
- Verify aliases resolve to built outputs: run package `build` before `vite build` when changing package APIs.
