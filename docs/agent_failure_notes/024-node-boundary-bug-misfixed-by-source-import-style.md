---
title: Agent Failure Note – Node Boundary Bug Misfixed by Source Import Style
agent: Codex
model: GPT-5
date: 2026-03-17
---

# Agent Failure Note – Node Boundary Bug Misfixed by Source Import Style

## Short Summary

When a Node-executed CLI failed because it directly loaded bundler-oriented package outputs, the agent started rewriting source imports to use `.js` extensions. This was the wrong fix level. The real bug was at the package boundary: a Node-facing build had been configured to externalize a dependency chain that was not meant to be executed directly by Node.

## Original Problem

`pmml28f4e` failed in CI when its built CLI executed under Node and imported `@8f4e/editor-state`, which in turn imported other workspace packages such as `@8f4e/state-manager` and `@8f4e/sprite-generator`.

Those packages emit `tsc` output with extensionless relative imports such as:

```js
import { createSet } from './set';
```

That is acceptable in this repo's bundler-oriented source/build flow, but not when Node directly executes the emitted files as native ESM.

The reason Node was executing them directly was that `@8f4e/editor-state` had been externalized from a Node-facing package build.

## Incorrect Fix Attempted (Anti-Pattern)

The agent started changing source imports in workspace packages to add `.js` suffixes:

```ts
import { createSet } from './set.js';
import type { Path } from './types.js';
```

and similarly in `sprite-generator`.

This pushed a Node-native ESM convention into source code that intentionally relies on bundlers and TypeScript path rewriting behavior.

## Failure Pattern

When a runtime error appears in a downstream consumer, the agent "fixes" lower-level source code style to satisfy that runtime, instead of first questioning whether the consumer/build boundary is correct.

## Correct Solution

Fix the package boundary first:

1. Identify why Node is directly executing built files from packages that are designed for bundler-style consumption.
2. Reconsider the externalization/bundling decision in the Node-facing package.
3. Keep source import style aligned with the repo's normal toolchain conventions unless there is an explicit repo-wide decision to change them.

In this case, the right direction is:

- revert the `.js` source import edits
- fix the `pmml28f4e` / `editor-state` packaging boundary instead of bending `state-manager` and `sprite-generator` around Node's ESM resolver

## Prevention Guideline

**Do Not Fix Boundary Bugs by Rewriting Source Style**: If a Node runtime error appears only because a package is being consumed across an unusual boundary, do not immediately rewrite source imports or source conventions to satisfy that runtime. First ask whether the package should have been consumed that way at all.
