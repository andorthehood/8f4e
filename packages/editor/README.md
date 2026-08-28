# Editor Packages

This directory owns the packages that make up the editor product. The minimal editor, default product composition,
and deployable website are separate boundaries.

## Package Layout

- `packages/editor-default/` composes the core with the compiler worker, runtimes, standard library, examples, and
  browser storage.
- `packages/editor-website/` contains the HTML page and thin Vite entry point that mounts the default composition.
- `packages/editor-core/` contains the reusable minimal editor and its state and UI packages.
- `packages/compiler-worker/` contains the editor-specific Web Worker wrapper around the compiler.
- `packages/runtime-audio-worklet/`, `packages/runtime-main-thread/`, and `packages/runtime-web-worker/` contain the
  editor runtime implementations.

## Development

From the workspace root:

```bash
npx nx run @8f4e/editor-website:dev
npx nx run @8f4e/editor-website:build
npx nx run @8f4e/editor-default:test
```

The development server runs at <http://localhost:3000>.
