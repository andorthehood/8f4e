# Contributing to 8f4e

Thanks for helping improve 8f4e. This repository contains the 8f4e language compiler, browser editor, runtime packages, examples, and supporting tools. The project is organized as an Nx monorepo, so most development tasks should be run through Nx.

## Looking for a Place to Start?

Welcome. If you want to contribute but are not sure where to begin, the todo notes in `docs/todos/` are usually a good place to start. They collect follow-up work that tends to be approachable for new contributors, while still being useful for the project.

## Prerequisites

- Node.js `24.11.0`; run `nvm use` from the repository root.
- npm `10` or newer.
- Git submodules initialized. `npm install` runs this automatically through the `preinstall` script.

## Getting Started

```bash
nvm use
npm install
npx nx run app:build
npx nx run app:dev
```

The development server runs at <http://localhost:3000>.

If another dev server is already using port `3000`, stop it with:

```bash
npx nx run app:kill-dev
```

## Repository Layout

- `index.html` and `src/`: root browser app entry points.
- `packages/compiler`: core compiler from 8f4e source to WebAssembly.
- `packages/editor`: main editor package and nested editor libraries.
- `packages/runtime-*`: runtime packages for audio worklets, web workers, and the main thread.
- `packages/examples`: example modules and projects.
- `packages/cli`: command-line compiler tooling.
- `packages/config`: shared workspace configuration.
- `docs/`: language documentation, ADRs, postmortems, and agent guidance.

Use package README files for package-specific context. Some package directories also contain `AGENTS.md` files with extra instructions for automated contributors.

## Development Workflow

Prefer Nx commands over direct tool invocations so dependencies, caching, and target defaults are respected.

```bash
npx nx run app:dev                  # build packages in watch mode and start Vite
npx nx run app:build                # type-check and build the root app
npx nx run app:serve                # preview the production build
npx nx run-many --target=build --all
npx nx run-many --target=test --all
npx nx run-many --target=typecheck --all
npx nx run app:lint
npx nx graph
```

When changing package APIs, build the affected package dependencies before relying on aliases such as `@8f4e/editor` from the app.

## Documentation

Update docs when behavior, public APIs, examples, or contributor workflows change. Start with:

- `README.md` for project-level setup and architecture.
- `docs/README.md` for language documentation.
- Package-level README files for package-specific APIs and workflows.

## Commits

Use Conventional Commits:

- `feat(package-name): <summary>` for package-specific features.
- `fix(package-name): <summary>` for package-specific fixes.
- `feat: <summary>` or `fix: <summary>` for root-level or cross-package changes.
- `docs: <summary>` or `docs(scope): <summary>` for documentation-only changes.
- `chore(ci): <summary>` or `chore(tooling): <summary>` for non-release maintenance.

Release semantics are driven by commit type: `fix` creates patch releases, `feat` creates minor releases, and breaking changes create major releases. Do not use `chore(release): ...` for hand-written commits; that scope is reserved for generated release commits.

## Pull Requests

Good pull requests include:

- A concise summary of what changed.
- The rationale for the change.
- Test notes with exact commands run.
- Linked issues when applicable.
- Screenshots or GIFs for editor or UI changes.
- Documentation updates when behavior or APIs change.

Before opening a PR, run the narrowest useful validation for your change. For shared compiler, editor, or runtime changes, prefer type-checking and testing all affected projects through Nx.
