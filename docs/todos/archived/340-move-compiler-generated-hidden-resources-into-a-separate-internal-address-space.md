---
title: 'TODO: Move compiler-generated hidden resources into a separate internal address space'
priority: Medium
effort: 1-2 days
created: 2026-03-27
status: Completed
completed: 2026-03-27
---

# TODO: Move compiler-generated hidden resources into a separate internal address space

## Problem Description

The compiler still has helper instructions that require hidden storage, such as:

- `risingEdge`
- `fallingEdge`
- `hasChanged`
- `branchIfUnchanged`
- other helper-generated implementation resources

The current system still lets these hidden resources influence module-level memory planning.
That creates two related problems:

- semantic layout needs to replay enough instruction behavior to discover hidden resource usage
- module addresses and intermodule address calculations become coupled to compiler-internal storage

This is the main remaining architectural leak after separating parsing, semantic collection,
and codegen more cleanly elsewhere.

## Proposed Solution

Keep module/user memory and compiler-generated hidden resources in different logical address spaces.

The intended pipeline is:

1. collect semantic namespaces and user memory declarations
2. finalize module/user memory layout completely
3. start a compiler-internal allocator at the next free address after module memory
4. allocate hidden resources from that internal allocator
5. let codegen use those internal addresses directly

This means:

- `namespace.memory` should describe only user/module memory
- compiler-generated hidden resources should live in a separate semantic/codegen-owned container
- intermodule address operators and module size calculations should not include hidden resources

## Anti-Patterns

- Do not keep hidden storage in normal module memory maps under generated names like `__foo...`
- Do not keep replaying instruction compilers during semantic layout just to discover hidden memory
- Do not let helper-generated storage change module `byteAddress`, `wordAlignedAddress`, or module `wordAlignedSize`

## Implementation Plan

### Step 1: Introduce internal resource state in compilation context
- Add an explicit compiler-internal resource container to compilation context
- Add an internal allocator that starts after finalized module/user memory
- Keep this state separate from `namespace.memory`

### Step 2: Plan module/user memory independently of hidden resources
- Finalize user/module memory layout from namespace collection alone
- Ensure module addresses and intermodule address calculations depend only on user/module memory
- Remove hidden-resource influence from namespace-level memory sizing

### Step 3: Migrate helper instructions to internal resource allocation
- Update helper instructions like `risingEdge`, `fallingEdge`, `hasChanged`, and `branchIfUnchanged`
- Replace synthetic declaration-shaped hidden storage with direct internal-resource allocation
- Make codegen consume internal resource addresses without mutating module memory layout

### Step 4: Delete transitional planning duplication
- Remove the semantic workaround that replays instruction behavior to discover hidden storage
- Remove generic declaration-routing paths that only exist for helper-generated hidden resources
- Keep semantic collection and codegen separated again

## Success Criteria

- [ ] Module/user memory layout is finalized without considering hidden helper storage
- [ ] Compiler-generated hidden resources are allocated from a separate internal address space
- [ ] Hidden resources no longer affect module addresses or intermodule address calculations
- [ ] Helper instructions no longer synthesize declaration-shaped storage for hidden resources
- [ ] The semantic layer no longer needs to replay codegen behavior just to discover hidden memory

## Affected Components

- `packages/compiler/src/semantic/` - user memory planning vs internal resource planning boundary
- `packages/compiler/src/compiler.ts` - compilation context and codegen state shape
- `packages/compiler/src/instructionCompilers/` - helper instructions that currently rely on hidden storage
- `packages/compiler/src/types.ts` - context/resource typing

## Cleanup Targets

These current workaround paths should be revisited and ideally deleted or simplified once
hidden resources move into a separate internal address space:

- [packages/compiler/src/compiler.ts](/packages/compiler/src/compiler.ts)
  - `compileLine(...)` still has a generic declaration branch kept partly for helper-generated hidden storage
- [packages/compiler/src/semantic/buildNamespace.ts](/packages/compiler/src/semantic/buildNamespace.ts)
  - `planNamespaceLayout(...)` currently replays instruction behavior to discover hidden storage during semantic layout
- [packages/compiler/src/instructionCompilers/risingEdge.ts](/packages/compiler/src/instructionCompilers/risingEdge.ts)
  - still synthesizes hidden previous-value storage through declaration-shaped snippets
- [packages/compiler/src/instructionCompilers/fallingEdge.ts](/packages/compiler/src/instructionCompilers/fallingEdge.ts)
  - still synthesizes hidden previous-value storage through declaration-shaped snippets
- [packages/compiler/src/instructionCompilers/hasChanged.ts](/packages/compiler/src/instructionCompilers/hasChanged.ts)
  - still synthesizes hidden previous-value storage through declaration-shaped snippets
- [packages/compiler/src/instructionCompilers/branchIfUnchanged.ts](/packages/compiler/src/instructionCompilers/branchIfUnchanged.ts)
  - still synthesizes hidden previous-value storage through declaration-shaped snippets

## Risks & Considerations

- **Address stability**: internal resource allocation must not leak back into module address calculations
- **Helper coverage**: all helper instructions that currently create hidden storage must migrate together or be clearly isolated
- **Allocator shape**: use a simple explicit allocator first; do not overdesign a full IR if a small resource map is enough

## Related Items

- **Supersedes**: 333 `Move memory declaration semantics into compiler semantic pass`
- **Supersedes**: 335 `Separate compiler-generated hidden storage from user memory declarations`
- **Related**: 334 `Move locals out of namespace and into codegen state`

## Notes

- The physical implementation can still use the same underlying WASM linear memory.
- The important distinction is logical ownership and address planning: module/user memory first, compiler-internal resources second.
