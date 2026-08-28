# Editor Application

This package is the composed browser editor. It combines the minimal `@8f4e/editor-core` package with the compiler
worker, runtime implementations, standard-library resolver, example registries, browser storage, and the Vite
application entry point.

## Package Layout

- `src/` contains the application composition and browser entry point.
- `packages/editor-core/` contains the reusable minimal editor and its state and UI packages.
- `packages/compiler-worker/` contains the editor-specific Web Worker wrapper around the compiler.
- `packages/runtime-audio-worklet/`, `packages/runtime-main-thread/`, and `packages/runtime-web-worker/` contain the
  editor runtime implementations.

## Development

From the workspace root:

```bash
npx nx run @8f4e/editor:dev
npx nx run @8f4e/editor:build
npx nx run @8f4e/editor:test
```

The development server runs at <http://localhost:3000>.
