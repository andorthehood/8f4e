# Default Editor

`@8f4e/editor-default` is the standard 8f4e editor composition. It connects `@8f4e/editor-core` to the compiler
worker, runtime implementations, standard library, example registries, and browser persistence.

The package exports `mountDefaultEditor(canvas, options)`. It does not mount itself when imported, so websites and
other browser hosts control when and where the editor starts.

```ts
import { mountDefaultEditor } from '@8f4e/editor-default';

await mountDefaultEditor(canvas);
```

The host controls the canvas's layout dimensions with CSS. The editor observes that rendered size and adapts its
drawing buffer and UI automatically.

Build, test, and type-check it from the workspace root:

```bash
npx nx run @8f4e/editor-default:build
npx nx run @8f4e/editor-default:test
npx nx run @8f4e/editor-default:typecheck
```
