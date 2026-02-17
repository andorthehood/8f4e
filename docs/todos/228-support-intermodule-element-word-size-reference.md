---
title: 'TODO: Support Inter-Module Element Word Size References'
priority: Medium
effort: 3-5h
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Support Inter-Module Element Word Size References

## Problem Description

`%name` (element word size in bytes) currently applies only to local memory. Inter-module defaults/init values cannot reference another module's element size directly.

## Proposed Solution

Add inter-module element-word-size support:
- `%module.memory`

Resolve to `targetMemory.elementWordSize` (same semantics as local `%name`).

## Implementation Plan

### Step 1: Syntax recognition
- Add `$`-style inter-module parser support for `%module.memory` with exactly one dot.
- Reject multi-dot or malformed variants.

### Step 2: Deferred parse behavior
- Ensure compiler argument parsing classifies this as inter-module derived reference and defers resolution until post-pass.

### Step 3: Resolver extension
- Extend `resolveInterModularConnections` in `packages/compiler/src/index.ts` to compute and assign `targetMemory.elementWordSize`.

### Step 4: Dependency sorting alignment
- Update `packages/compiler/src/graphOptimizer.ts` dependency extraction so `%module.memory` creates a dependency on `module`.

### Step 5: Test coverage
- Create dedicated test folder: `packages/compiler/tests/intermodular-references/`.
- Add focused spec file for element-word-size behavior (for example `element-word-size.test.ts`) covering:
  - declaration default using `%module.memory`
  - `init` second argument using `%module.memory`
  - unknown module/memory failures
  - invalid multi-dot forms
- Add ordering regression in the same folder (or adjacent shared spec) ensuring dependency sort includes `%module.memory`.

## Success Criteria

- [x] `%module.memory` is accepted in declaration/default and `init` paths.
- [x] Resolver writes `elementWordSize`.
- [x] Multi-dot forms are rejected.
- [x] Dependency sorting recognizes `%module.memory`.
- [x] `npx nx run compiler:test` passes.

## Affected Components

- `packages/compiler/src/syntax/*`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/tests/intermodular-references/*`

## Related Items

- `docs/todos/226-support-intermodule-buffer-end-reference.md`
