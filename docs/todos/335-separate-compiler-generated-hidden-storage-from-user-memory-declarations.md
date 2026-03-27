---
title: 'TODO: Separate compiler-generated hidden storage from user memory declarations'
priority: Medium
effort: 6-10 hours
created: 2026-03-27
status: Open
completed: null
---

# 335 - Separate compiler-generated hidden storage from user memory declarations

- Priority: 🟡 Medium
- Effort: 6-10h
- Created: 2026-03-27
- Status: Active

## Summary

Several instructions still rely on compiler-generated hidden storage such as:

- `__hasChanged...`
- `__risingEdge...`
- `__fallingEdge...`
- `__map_...`

Historically these were introduced by synthesizing declaration-shaped source snippets and routing them through the normal declaration machinery. That is one of the remaining reasons `compileLine(...)` still has a generic memory-declaration branch outside the main semantic prepass/codegen split.

This makes the architecture harder to reason about because compiler-internal storage is represented as if it were user-declared memory.

## Goal

Stop modeling compiler-generated hidden storage as ordinary declaration instructions. Compiler-internal storage should have its own explicit planning path so user memory declarations remain semantic-only and the generic compile path no longer needs to handle synthetic declaration snippets.

## Problems To Remove

- Compiler-generated storage currently shares the same conceptual path as user declarations.
- Hidden memory items rely on generated names instead of explicit ownership.
- `compileLine(...)` still has a declaration branch partly to support helper-generated declaration snippets.
- User memory and compiler-internal storage are not clearly separated in the architecture.

## Proposed Refactor

### 1. Introduce explicit compiler-internal storage planning

Inside `packages/compiler/src/semantic/`, add a dedicated mechanism for planning hidden storage required by helper instructions.

This planner should own:

- allocation of internal memory items
- stable internal identifiers
- address/layout integration with the final memory plan

without expressing those allocations as synthetic source declarations.

### 2. Separate internal storage from user declarations

Keep user-declared memory and compiler-generated storage distinct in the semantic artifact, even if they are merged later for final layout.

For example:

- user declarations remain in the user memory map
- compiler-generated storage is tracked in a separate internal map or explicit resource list

### 3. Remove synthetic declaration snippets from helper instructions

Instructions and helpers that currently create hidden storage via generated declaration-like snippets should be changed to request internal storage directly from the semantic layer.

### 4. Delete generic declaration fallback from compileLine

Once hidden storage no longer depends on declaration-shaped snippets, `compileLine(...)` should no longer need a generic declaration branch. Declaration handling should stay in the semantic layer only.

## Success Criteria

- Compiler-generated hidden storage is planned explicitly, not through synthetic declaration AST/source snippets.
- User memory declarations remain semantic-only.
- `compileLine(...)` no longer needs the generic memory-declaration branch for hidden helper storage.
- The architecture clearly distinguishes user-declared memory from compiler-internal storage.

## Notes

This is a follow-up to:

- 333 `Move memory declaration semantics into compiler semantic pass`
- 334 `Move locals out of namespace and into codegen state`

It targets one of the last remaining leaks in the semantic/codegen boundary: hidden implementation storage still masquerading as user declaration input.
