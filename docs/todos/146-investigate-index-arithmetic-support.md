---
title: 'TODO: Investigate index arithmetic support'
priority: Medium
effort: 2-4 hours
created: 2025-12-25
status: Open
completed: null
---

# TODO: Investigate index arithmetic support

## Problem Description

8f4e currently only supports byte-level arithmetic for memory addresses. This makes index-style arithmetic (like C pointer/index math) cumbersome, error-prone, and inconsistent with expectations when working with arrays or structured memory layouts.

## Proposed Solution

Investigate the scope, impact, and implementation effort needed to add index arithmetic support, including:
- Define desired semantics (e.g., index math scales by element size, how it interacts with byte pointers, and any explicit conversions).
- Identify required changes in the compiler type system, validation rules, and instruction set.
- Assess runtime/WASM codegen implications and any editor or tooling updates.
- Evaluate candidate approaches, such as:
  - A dedicated instruction (e.g., `addIndex`) that always scales the index operand by the word size of the address operand.
  - Extending `add` to detect when one operand is a memory address and implicitly scale the other operand by the address operand's word size.
  - Replacing the existing `$` prefix (which pushes the word size of a symbol) with an explicit `sizeof` instruction to make scaling clearer.
  - Brainstorm other viable options beyond instruction-level changes.

## Implementation Plan

### Step 1: Audit current arithmetic and memory model
- Inventory where byte arithmetic is enforced or assumed in compiler validation, instruction definitions, and codegen.
- Identify any existing index-like usage patterns or helpers.

### Step 2: Define index arithmetic semantics and surface area
- Specify how index values are represented and how scaling is applied.
- Decide whether this is a new type, new instructions, or updated rules for existing ops.

### Step 3: Produce an impact/effort assessment
- List affected components and estimated change size.
- Call out breaking changes, migration needs, and test coverage gaps.
- Recommend a minimal viable path vs. a fully typed solution.

## Success Criteria

- [ ] Written assessment covering semantics options, affected components, and estimated effort.
- [ ] Clear recommendation for how index arithmetic should be expressed and validated.
- [ ] Identified risks and migration considerations.

## Affected Components

- `packages/compiler` - instruction definitions, type rules, validation, codegen.
- `packages/editor` - block UI/type hints if new arithmetic semantics are surfaced.
- `docs/instructions.md` - language semantics and instruction reference.

## Risks & Considerations

- **Semantic ambiguity**: Mixing byte and index arithmetic could introduce confusing or unsafe behavior.
- **Breaking changes**: Existing programs may rely on byte semantics; conversions must be explicit.
- **WASM alignment**: Ensure scaling logic stays consistent with runtime memory layout.

## Related Items

- Related: compiler type system enhancements, instruction validation helpers.

## References

- `docs/instructions.md`

## Notes

- None.
