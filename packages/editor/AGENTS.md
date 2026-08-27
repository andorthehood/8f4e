# Repository Guidelines

## Package Scope & Layout

- Path: `packages/editor`; application source in `src/`, production output in `dist/`.
- Nx project: `@8f4e/editor`.
- This package composes `@8f4e/editor-core`, the compiler worker, runtime implementations, standard library,
  examples, and browser persistence into the deployable editor.
- Reusable minimal-editor behavior belongs in `packages/editor/packages/editor-core` rather than this composition layer.

## Build, Test, Dev

- From root: `npx nx run @8f4e/editor:build|test|typecheck`.
- Start the development server with `npx nx run @8f4e/editor:dev`.
- Preview the production build with `npx nx run @8f4e/editor:serve`.
- Ensure dependency packages are built before relying on workspace aliases in the Vite application.

## Coding Style

- TypeScript (ES modules). Use Biome as the fixer (`npx biome check --write <files>`).
- Keep `src/` focused on application composition and browser/deployment integration.
- Prefer workspace aliases for inter-package references.

## Testing

- Vitest tests live under `src/__tests__` or alongside source as `*.test.ts`.
- Test composition behavior here; test reusable editor behavior in `@8f4e/editor-core`.

## Pull Requests

- Include test notes and explain any package-boundary changes.
- Add screenshots or GIFs when editor behavior or appearance changes.
