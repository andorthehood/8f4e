# Default Editor

`@8f4e/editor-default` is the standard 8f4e editor composition. It connects `@8f4e/editor-core` to the compiler
worker, runtime implementations, standard library, example registries, and browser persistence.

The package exports `mountDefaultEditor(canvas, options)`. It does not mount itself when imported, so websites and
other browser hosts control when and where the editor starts.

```ts
import { mountDefaultEditor } from '@8f4e/editor-default';

const editor = await mountDefaultEditor(canvas, {
	captureWheel: false,
	storageNamespace: 'editor-a',
});

editor.state;
editor.releaseRenderingResources();
editor.resumeRendering();
editor.dispose();
```

`releaseRenderingResources()` pauses rendering and releases reloadable GPU textures, dynamic buffer storage, and the
canvas drawing buffer. `resumeRendering()` restores the resources, applies the latest canvas size, and renders
immediately.

The host controls the canvas's layout dimensions with CSS. The editor observes that rendered size and adapts its
drawing buffer and UI automatically. Wheel input pans the editor and prevents page scrolling by default; embedded
hosts can pass `captureWheel: false` to leave scrolling to the page.

Each mounted editor owns its compiler worker, compiled memory and code-buffer state, and lazy runtime registry.
It also owns persistence callbacks for its storage namespace. The default namespace is `editor`, which preserves the
existing `project_editor` and `browserLocalNotes_editor` keys. Hosts mounting multiple editors should pass a stable,
unique namespace for each editor. Hosts may also provide a custom `Storage` implementation or an
`initialProjectUrl`; interpreting page URLs remains the host's responsibility.

Build, test, and type-check it from the workspace root:

```bash
npx nx run @8f4e/editor-default:build
npx nx run @8f4e/editor-default:test
npx nx run @8f4e/editor-default:typecheck
```
