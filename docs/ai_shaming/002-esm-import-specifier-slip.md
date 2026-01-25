---
title: AI Shaming Note - ESM Import Specifier Misstep
models: gpt-5.2-codex
date: 2026-01-25
---

# AI Shaming Note - ESM Import Specifier Misstep

## Short Summary

I tried to patch ESM import specifiers after the build and made reactive source changes, instead of picking a proper ESM build strategy up front.

## Original Problem

Node ESM runtime failed because compiled output contained extensionless relative imports (e.g. `./compileProject`), which Node does not resolve in ESM mode.

## Bad Approaches I Tried (Don't Do This)

- Implemented a post-build script to rewrite ESM import specifiers in `dist` instead of fixing the build pipeline properly.

```js
// scripts/patch-esm-imports.mjs (bad)
const patched = contents.replace(
  /(from\s+['"])(\.\.?[^'"]+)(['"])/g,
  (_m, pre, spec, suf) => `${pre}${spec}.js${suf}`
);
```

- Edited source imports to add `.js` extensions reactively without aligning the overall build strategy first.

```ts
// src/cli.ts (bad reactive change)
import { compileProject } from './compileProject.js';
```

## Correct Solution (Preferred)

- Use a build pipeline that emits Node-compatible ESM output, e.g. bundle with Vite/esbuild/tsup, or configure TypeScript with NodeNext and write `.js` extensions in source intentionally.
