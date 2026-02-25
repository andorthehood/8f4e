---
title: Agent Failure Note – Fake lazy-loading via static import leak
agent: GitHub Copilot Agent
model: Claude Sonnet 4.6
date: 2026-02-25
---

# Agent Failure Note – Fake lazy-loading via static import leak

## Short Summary

The agent implemented dynamic imports for example registry callbacks in `src/editor.ts`, but left a static import path in `src/storage-callbacks.ts` that kept the same module in the startup chunk. It also omitted end-to-end verification, so the false-positive "lazy-loading" result was not caught.

## Original Problem

The goal was to lazy-load example modules metadata and registry code so startup bundle size is reduced.

Observed after implementation:
- `src/editor.ts` used `import('./examples/registry')` with a cached promise.
- `src/storage-callbacks.ts` still had static imports from `./examples/registry`.
- Vite emitted: dynamic import will not move module into another chunk because it is also statically imported.
- No production-bundle verification was run to prove startup chunk reduction.

## Anti-Patterns

1. Applying lazy-loading only at one callsite while leaving another static import of the same module in startup code.
2. Declaring success based on code shape ("uses dynamic import") instead of validating bundle output/chunking behavior.
3. Caching a rejected dynamic-import promise forever (no retry path), causing permanent callback failure after one transient chunk-load error.
4. Omitting verification entirely (no build artifact inspection, no runtime path validation).

Why this is wrong:
- Bundlers preserve statically imported modules in entry chunks.
- Partial lazy-loading refactors can be functionally equivalent to no lazy-loading.
- A global rejected promise cache creates brittle runtime behavior.
- Without verification, regressions or non-functional optimizations are likely to pass review unnoticed.

## Failure Pattern

Superficial lazy-loading refactor that changes syntax but not actual bundling/runtime behavior, compounded by missing verification.

## Correct Solution

1. Remove all startup static imports of `./examples/registry` from eager paths (`src/storage-callbacks.ts` included), or move those callsites behind the same lazy boundary.
2. Re-run production build and verify chunk split with concrete checks (bundle output and grep/signatures in entry chunk).
3. Make lazy registry loader resilient:
- if import fails, clear cached promise and allow retry on next call.
4. Validate behavior end-to-end:
- module/project menus still load,
- default project loading still works,
- startup chunk no longer embeds example module metadata table.
