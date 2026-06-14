---
title: 'TODO: Decouple module execution order from memory layout'
priority: Medium
effort: 4-8h
created: 2026-06-14
issue: null
status: Open
completed: null
---

# TODO: Decouple Module Execution Order From Memory Layout

## Problem Description

Module order currently carries two meanings:

- the order in which modules execute inside an entry dispatcher;
- the order in which modules occupy linear memory.

This makes editor/source reordering too expensive. Moving a module to change execution order can change module byte
addresses, which can invalidate memory layout even when declarations and defaults are unchanged.

The coupling happens because `compileSubProgram` builds `astModules` in entry/module order, passes that same order as
`layoutAsts` into `collectNamespacesFromASTs`, and then compiles modules in that same order for dispatcher emission.

## Proposed Solution

Introduce an explicit stable memory layout order that is separate from execution order.

The likely default should be module id order:

- keep `astModules` in execution order for `compileModules(...)` and entry dispatcher generation;
- derive `memoryLayoutModules` from `astModules` sorted by module id;
- pass `memoryLayoutModules` as `layoutAsts` to `collectNamespacesFromASTs(...)`;
- keep compiled module indexes and `executionEntryName` assignment based on execution order.

This should let users reorder modules to change scheduling without changing memory addresses unless the module ids,
declarations, regions, or sizes actually change.

## Anti-Patterns

- Do not sort `compiledModules` for code emission; the dispatcher still needs execution order.
- Do not derive memory layout from object key enumeration unless the ordering policy is explicit and tested.
- Do not rely on cache keys such as `entry:<name>:module:<index>` as layout identity; index changes are exactly what
  this TODO should make harmless for memory layout.
- Do not ignore custom memory regions. Stable ordering must apply independently within each memory index.

## Implementation Plan

### Step 1: Add Stable Layout Ordering

- Add a small helper near `compileSubProgram` or namespace layout code to sort module ASTs by stable layout key.
- Use module id as the initial layout key.
- Pass the sorted list as `layoutAsts` while preserving `astModules` order for compilation.

### Step 2: Preserve Execution Semantics

- Verify `compiledModules` remains in execution order.
- Verify `entryDispatcherFunctions` still call modules in the order supplied by each entry.
- Keep `executionEntryName` assignment aligned with the original module entries.

### Step 3: Tighten Memory Reuse Detection

- Review `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts`.
- Decide whether byte addresses, memory indexes, and memory item shapes should be compared explicitly.
- Add coverage so layout changes cannot be silently treated as compatible memory reuse.

### Step 4: Add Regression Tests

- Add a compiler regression where two modules are compiled in one order and then the reverse order.
- Assert module memory addresses are unchanged when module ids and declarations are unchanged.
- Assert generated entry execution still follows the requested module order.
- Include a custom-memory-region case if existing test helpers make it cheap.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler-worker:test`
- Focused regression tests around `compileSubProgram`, `collectNamespacesFromASTs`, and worker memory reuse.

## Success Criteria

- [ ] Reordering modules changes execution order without changing stable module memory addresses.
- [ ] Memory layout remains deterministic across recompiles for unchanged module ids and declarations.
- [ ] Entry dispatchers still execute modules in user-specified order.
- [ ] Worker memory reuse/recreation decisions account for any true memory layout change.
- [ ] Existing intermodule address references continue to resolve correctly.

## Affected Components

- `packages/compiler/src/compileSubProgram.ts` - separates execution order from layout order.
- `packages/compiler/src/semantic/buildNamespace.ts` - consumes the explicit layout order.
- `packages/compiler/src/compileModules.ts` - should continue compiling in execution order using precomputed addresses.
- `packages/compiler/src/index.ts` - dispatcher generation must remain execution-order driven.
- `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts` - memory compatibility checks may need to include
  address/layout identity.

## Risks & Considerations

- **Behavior change**: existing projects may see one intentional memory-layout change when the new stable policy first
  lands.
- **Intermodule references**: defaults and compile-time address references must continue to resolve after namespace
  discovery and layout are split by ordering policy.
- **Custom regions**: module order should be stable per memory region without mixing address spaces.
- **Function indexes**: execution-order module indexes must stay aligned with emitted cycle functions.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`
- **Related**: `docs/todos/406-review-compiler-namespace-prepass-repetition.md`
- **Related**: `docs/todos/archived/422-split-namespace-discovery-and-layout-prepass.md`
