---
title: 'TODO: Support Inter-Module Element Max Value References'
priority: Medium
effort: 3-5h
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Support Inter-Module Element Max Value References

## Problem Description

`^name` currently supports local memory only. Inter-module declarations/init cannot use another module's element max value directly.

## Proposed Solution

Add inter-module element-max support:
- `^module.memory`

Resolve using the same type-aware logic as local `^name`:
- signed/unsigned integer ranges based on element type
- float max finite value for float elements

## Implementation Plan

### Step 1: Syntax and classification
- Recognize `^module.memory` as a dedicated inter-module derived reference shape.
- Keep strict one-dot syntax and reject extra segments.

### Step 2: Deferred compiler parse path
- Update compiler memory argument parsing so `^module.memory` is deferred to post-pass resolution.

### Step 3: Resolver implementation
- Extend `packages/compiler/src/index.ts` `resolveInterModularConnections`:
  - resolve target module + memory
  - compute max value from target memory metadata with existing max-value helpers
  - assign to source default

### Step 4: Sorting/dependency extraction
- Update `packages/compiler/src/graphOptimizer.ts` so `^module.memory` contributes dependency edges.

### Step 5: Tests
- Create dedicated test folder: `packages/compiler/tests/intermodular-references/`.
- Add focused spec file for element-max behavior (for example `element-max.test.ts`) covering:
  - signed int target max
  - unsigned target max
  - float target max
  - unknown module/memory failures
  - invalid multi-dot forms
- Add ordering regression in the same folder (or adjacent shared spec) ensuring dependency sort includes `^module.memory`.

## Success Criteria

- [ ] `^module.memory` resolves correctly for integer/unsigned/float element types.
- [ ] One-dot validation is enforced.
- [ ] Dependency sorting recognizes `^module.memory`.
- [ ] Compiler test suite passes.

## Affected Components

- `packages/compiler/src/syntax/*`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/tests/intermodular-references/*`

## Related Items

- `docs/todos/193-add-min-max-prefixes.md` (archived)
- `docs/todos/226-support-intermodule-buffer-end-reference.md`
