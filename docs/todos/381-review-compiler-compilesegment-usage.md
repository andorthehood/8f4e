---
title: 'TODO: Review compiler compileSegment usage for unnecessary self-compilation'
priority: Medium
effort: 2-4h
created: 2026-04-22
status: Active
---

# TODO: Review compiler compileSegment usage for unnecessary self-compilation

## Problem Description

Some instruction compilers currently call `compileSegment(...)` to express behavior in terms of other source-level instructions instead of emitting raw WebAssembly directly.

That is sometimes a useful implementation shortcut, but it can also be overused:
- it re-enters compilation logic from within an instruction compiler,
- it does more work than necessary for small primitive operations,
- it can hide the real lowering shape of an instruction,
- and it can emit longer bytecode than a direct wasm sequence.

The recent `notZero` change is a concrete example: lowering through other instructions was correct but unnecessarily indirect compared to direct `ne` opcodes.

## Proposed Solution

Review all current `compileSegment(...)` usage sites in the compiler and classify them into:

- cases that should remain as composition because they genuinely benefit from shared instruction semantics,
- cases that should be replaced with direct wasm emission,
- and cases that should be rewritten into smaller shared helpers instead of nested source recompilation.

The goal is not to remove `compileSegment(...)` entirely. The goal is to make its use deliberate and limited to the places where it provides clear value.

## Anti-Patterns

- Do not replace every `compileSegment(...)` call mechanically without checking semantics.
- Do not change instruction behavior just to reduce bytecode length.
- Do not duplicate large chunks of compiler logic when a small helper extraction would be cleaner.
- Do not treat this as a broad compiler optimization pass; keep it focused on unnecessary self-compilation inside instruction compilers.

## Implementation Plan

### Step 1: Inventory existing usage
- Find all `compileSegment(...)` call sites under `packages/compiler/src/`.
- Record the instruction or utility owning each call site.
- Note whether the segment is being used for:
  - simple opcode composition,
  - stack-shape reuse,
  - semantic reuse,
  - or test-only / setup convenience.

### Step 2: Classify each usage
- Mark each call site as one of:
  - **keep**,
  - **replace with raw wasm**,
  - **replace with internal helper**.
- Prefer raw wasm for small primitive operations with obvious direct opcodes.
- Prefer helpers when the current segment exists only to share a small common sequence.

### Step 3: Apply targeted cleanups
- Replace the clearest low-risk cases first.
- Add or update tests when opcode shape changes.
- Keep any remaining `compileSegment(...)` sites documented by rationale in code comments or follow-up TODOs where appropriate.

## Validation Checkpoints

- `rg -n "compileSegment\\(" packages/compiler/src`
- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`

## Success Criteria

- [ ] Every remaining `compileSegment(...)` call site in instruction compilers has a clear justification.
- [ ] Primitive instruction compilers do not use `compileSegment(...)` when direct wasm emission is clearer and smaller.
- [ ] Any behavior-preserving rewrites remain covered by existing or updated tests.
- [ ] The audit produces either code cleanups or explicit follow-up notes for deferred cases.

## Affected Components

- `packages/compiler/src/compiler.ts` - owner of `compileSegment(...)`.
- `packages/compiler/src/instructionCompilers/` - primary audit surface.
- `packages/compiler/src/utils/` - any helper-level composition sites discovered during review.

## Risks & Considerations

- **Behavior drift**: replacing composed lowering with raw wasm can subtly change stack metadata or type propagation if done carelessly.
- **False savings**: some uses may look redundant but actually rely on existing instruction validation or stack-shape handling.
- **Scope creep**: keep this as a focused audit, not a general compiler refactor.

## Related Items

- **Related**: `docs/todos/055-strength-reduction-compiler-optimization.md`
- **Related**: `docs/todos/261-update-instruction-test-helpers-for-float64.md`

## Notes

- Start with the simplest instruction-level cases first, especially unary comparisons and small normalization helpers.
