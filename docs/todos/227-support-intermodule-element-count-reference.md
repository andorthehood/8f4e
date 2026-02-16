---
title: 'TODO: Support Inter-Module Element Count References'
priority: Medium
effort: 3-5h
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Support Inter-Module Element Count References

## Problem Description

`$name` currently works only for local memory identifiers. There is no inter-module equivalent, so modules cannot directly derive element counts from buffers declared in other modules during default/init resolution.

## Proposed Solution

Add inter-module element-count support with strict one-dot syntax:
- `$module.memory`

Resolve to `targetMemory.wordAlignedSize` (same semantics as local `$name`).

## Implementation Plan

### Step 1: Define and validate syntax
- Extend syntax classification to recognize `$module.memory` as inter-module element-count reference.
- Enforce exactly one dot (`module.memory`), no extra segments.

### Step 2: Defer during argument parsing
- In compiler-level memory argument parsing, keep deferred behavior for this new inter-module shape (do not resolve during per-module compile pass).

### Step 3: Resolve in post-pass
- Extend `packages/compiler/src/index.ts` `resolveInterModularConnections` to handle `$module.memory`.
- Lookup target module + memory and assign `wordAlignedSize` into the source default.

### Step 4: Keep dependency sorting aligned
- Update `packages/compiler/src/graphOptimizer.ts` so `$module.memory` contributes a dependency edge on `module`.

### Step 5: Add tests
- Create dedicated test folder: `packages/compiler/tests/intermodular-references/`.
- Add focused spec file for element-count behavior (for example `element-count.test.ts`) covering:
  - declaration default using `$module.memory`
  - `init` second argument using `$module.memory`
  - unknown module/memory failures
  - invalid multi-dot forms
- Add ordering regression in the same folder (or adjacent shared spec) ensuring dependency sort includes `$module.memory`.

## Success Criteria

- [x] `$module.memory` is accepted in declaration/default and `init` second-argument paths.
- [x] Resolver writes `target.wordAlignedSize` into defaults.
- [x] Multi-dot forms are rejected.
- [x] Dependency sorting recognizes `$module.memory`.
- [x] `npx nx run compiler:test` passes.

## Affected Components

- `packages/compiler/src/syntax/*`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/tests/intermodular-references/*`

## Related Items

- `docs/todos/226-support-intermodule-buffer-end-reference.md`
