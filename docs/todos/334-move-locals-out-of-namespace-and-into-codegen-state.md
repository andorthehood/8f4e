---
title: 'TODO: Move locals out of namespace and into codegen state'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# 334 - Move locals out of namespace and into codegen state

- Priority: 🟡 Medium
- Effort: 4-8h
- Created: 2026-03-27
- Status: Active

## Summary

The compiler semantic/codegen boundary is much cleaner now for constants, memory declarations, and compile-time folding, but local-variable state still lives under `context.namespace.locals`.

That name is misleading because locals are not semantic namespace data in the same sense as:

- `namespace.consts`
- `namespace.memory`
- `namespace.namespaces`

Instead, locals are mutable function/codegen state that gets built while compiling:

- `param`
- `local`
- helper-generated locals such as `mapEnd`

Keeping them under `namespace` makes the architecture harder to read and obscures which state is still intentionally mutable during codegen.

## Goal

Move local-variable tracking out of `context.namespace` and into explicit codegen state, so semantic namespace data stays clearly separated from mutable per-function compilation state.

## Problems To Remove

- `context.namespace.locals` suggests locals are part of semantic namespace ownership.
- Codegen still mutates `namespace.locals`, which makes the remaining mutable state look architecturally similar to old `namespace.memory` mutations.
- Function-local allocation logic is harder to reason about because semantic and codegen concerns share the same object graph.

## Proposed Refactor

### 1. Add explicit local state to compilation context

Introduce a dedicated field for mutable locals, for example:

- `context.locals`

or another clearly codegen-scoped name.

This should become the canonical place for:

- parameters
- explicit `local` declarations
- helper-generated temporary locals

### 2. Update instruction compilers to use codegen-local state

Move local reads/writes away from `context.namespace.locals` in instructions such as:

- `param`
- `local`
- `localGet`
- `localSet`
- `mapEnd`
- helper instructions that inspect or synthesize locals

### 3. Keep semantic namespace data separate

After the move, `context.namespace` should remain focused on semantic/module-level data such as:

- constants
- memory
- module names
- imported namespaces

and should no longer be the container for per-function mutable local allocation state.

## Success Criteria

- `context.namespace.locals` no longer exists.
- Local-variable allocation and lookup use explicit codegen state.
- Function compilation behavior and local indices remain unchanged.
- The semantic/codegen boundary becomes clearer because mutable locals are no longer stored under `namespace`.

## Notes

This is a cleanup follow-up to the larger semantic/codegen refactor. It is not required to centralize compile-time folding, but it removes one of the last misleading pieces of mutable state still living under the semantic namespace container.
