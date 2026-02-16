---
title: 'TODO: Support Inter-Module Element Min Value References'
priority: Medium
effort: 3-5h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Support Inter-Module Element Min Value References

## Problem Description

`!name` currently works only for local memory identifiers. There is no inter-module equivalent for min-value derivation during declaration/init default resolution.

## Proposed Solution

Add inter-module element-min support:
- `!module.memory`

Resolve using the same local `!name` semantics:
- signed integer minimums
- `0` for unsigned integer elements
- float lowest finite value for float elements

## Implementation Plan

### Step 1: Syntax/classification updates
- Recognize `!module.memory` as an inter-module derived reference.
- Enforce one-dot syntax; reject malformed or multi-dot forms.

### Step 2: Deferred parse behavior
- Ensure parser path keeps `!module.memory` unresolved during single-module compilation.

### Step 3: Post-pass resolver support
- Extend `packages/compiler/src/index.ts` `resolveInterModularConnections`:
  - resolve target module/memory
  - compute min value via existing min-value helper logic
  - assign to source default

### Step 4: Module dependency sort alignment
- Update `packages/compiler/src/graphOptimizer.ts` to include `!module.memory` dependencies.

### Step 5: Regression tests
- Create dedicated test folder: `packages/compiler/tests/intermodular-references/`.
- Add focused spec file for element-min behavior (for example `element-min.test.ts`) covering:
  - signed int target min
  - unsigned target min (`0`)
  - float target min
  - unknown module/memory failures
  - invalid multi-dot forms
- Add ordering regression in the same folder (or adjacent shared spec) ensuring dependency sort includes `!module.memory`.

## Success Criteria

- [ ] `!module.memory` resolves with type-correct min semantics.
- [ ] Multi-dot inter-module forms are rejected.
- [ ] Dependency sorting recognizes `!module.memory`.
- [ ] Compiler tests pass.

## Affected Components

- `packages/compiler/src/syntax/*`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/tests/intermodular-references/*`

## Related Items

- `docs/todos/193-add-min-max-prefixes.md` (archived)
- `docs/todos/226-support-intermodule-buffer-end-reference.md`
