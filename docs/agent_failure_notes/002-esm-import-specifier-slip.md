---
title: Agent Failure Note - ESM Import Specifier Misstep
model: gpt-5.2-codex
agent: codex-cli
date: 2026-01-25
---

# Agent Failure Note - ESM Import Specifier Misstep

## Summary

The goal was to produce a Node‑compatible ESM CLI build. The agent tried to patch ESM import specifiers after the build and made reactive source changes, rather than choosing a proper ESM build strategy up front.

## Original Problem

Node ESM runtime failed because compiled output contained extensionless relative imports (e.g. `./compileProject`), which Node does not resolve in ESM mode.

## Incorrect Fixes Attempted

- The agent added a made-up TypeScript config option (`preserveShebang`) that doesn’t exist in this toolchain.

```json
// tsconfig.json (bad)
{
  "compilerOptions": {
    "preserveShebang": true
  }
}
```

- The agent implemented a post-build script to rewrite ESM import specifiers in `dist` instead of fixing the build pipeline properly.

```js
// scripts/patch-esm-imports.mjs (bad)
const patched = contents.replace(
  /(from\s+['"])(\.\.?[^'"]+)(['"])/g,
  (_m, pre, spec, suf) => `${pre}${spec}.js${suf}`
);
```

- The agent edited source imports to add `.js` extensions reactively without aligning the overall build strategy first.

```ts
// src/cli.ts (bad reactive change)
import { compileProject } from './compileProject.js';
```

## Failure Pattern

Reactive patching of build output and source files instead of selecting and committing to a correct ESM strategy upfront.

## Correct Solution

Choose the ESM strategy before changing source code or build output. Once chosen, all imports, tooling, and runtime assumptions must align with it.