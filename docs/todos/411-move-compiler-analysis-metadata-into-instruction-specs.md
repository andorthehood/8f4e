---
title: 'TODO: Move compiler analysis metadata into instruction specs'
priority: Medium
effort: 1-2d
created: 2026-05-20
issue: null
status: Open
completed: null
---

# TODO: Move compiler analysis metadata into instruction specs

## Problem Description

TODO 397 separated stack analysis from code generation, but some compiler behavior is still encoded as code-first instruction knowledge instead of spec-first metadata.

The instruction specs already centralize operands, instruction scope, documentation, and editor-facing stack signature display. The next good configuration-over-code step is to move the generic analysis metadata there too, especially for:

- fixed stack effects for simple instructions;
- block close behavior;
- memory operation metadata, such as access width, operation kind, and result type.

Do not move function-like dynamic behavior or map-specific behavior into the spec in this pass. Those paths are still too specific to justify a generic configuration shape.

## Proposed Solution

Extend the compiler spec package with analysis metadata that describes generic instruction behavior. Keep the final type shape small and only add fields that remove real switch logic from the compiler.

Candidate metadata categories:

- **Stack effects**: consumed value count, produced value labels, preserved input value rules, and stack-clearing behavior.
- **Block behavior**: which block type an instruction closes, whether it restores a block result, and whether it needs a result-type validation rule.
- **Memory behavior**: load/store/copy/store-bytes operation kind, byte width, address operand role, and produced value type.

The stack analyzer and code generator should read this metadata for generic cases while retaining explicit code for the algorithms that are genuinely custom.

## Implementation Plan

### Step 1: Design the Spec Metadata

- Add narrowly scoped analysis metadata types to `packages/compiler-spec`.
- Keep the metadata declarative and instruction-agnostic.
- Avoid strategy callbacks or instruction-specific config names that just move code into data.

### Step 2: Move Fixed Stack Effects

- Convert simple fixed-effect instructions to read stack behavior from the spec.
- Cover arithmetic, comparisons, casts, stack manipulation, and other instructions that only consume and produce fixed stack shapes.
- Update analyzer tests alongside the refactor.

### Step 3: Move Block Close Metadata

- Move generic block-close shape into the specs for instructions such as `else`, `blockEnd`, `loopEnd`, and `ifEnd`.
- Keep custom function and map result validation logic explicit unless a genuinely reusable abstraction emerges.

### Step 4: Move Memory Operation Metadata

- Move memory access width, operation kind, address operand role, and produced value type into the instruction specs.
- Use the same spec metadata from stack analysis and code generation where possible.
- Remove duplicated memory maps once the spec becomes the source of truth.

### Step 5: Leave Dynamic Algorithms Explicit

- Keep `call`, `return`, and function-end signature logic in compiler code.
- Keep map-specific row/default/selection analysis in compiler code.
- Reconsider these only after a more generic abstraction becomes obvious from repeated behavior.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Confirm compiler architecture boundary tests still pass.
- Confirm editor tooltip stack signatures continue to render from instruction specs.

## Success Criteria

- [ ] Generic fixed stack effects are read from instruction specs.
- [ ] Generic block close behavior is read from instruction specs.
- [ ] Generic memory operation metadata is read from instruction specs.
- [ ] `analyzeInstruction.ts` only keeps custom algorithmic cases where configuration would be too specific.
- [ ] Code generation no longer maintains duplicate memory metadata that can live in the spec.
- [ ] Tests are updated to match the new spec-first structure.

## Affected Components

- `packages/compiler-spec/src/instructionSpecs.ts`
- `packages/compiler/src/stackAnalysis/analyzeInstruction.ts`
- `packages/compiler/src/codegen/`
- compiler stack analysis tests
- compiler architecture boundary tests
- editor tooltip stack signature rendering

## Risks & Considerations

- **Over-configuration risk**: Do not introduce compatibility layers or broad abstractions just to avoid updating compiler tests.
- **Behavior drift risk**: Moving stack effects into specs must preserve exact analyzer behavior.
- **Spec coupling risk**: Keep editor-facing documentation and compiler-facing analysis metadata distinct enough that one can evolve without surprising the other.
- **Memory guard risk**: Memory validation and code generation must agree on width and operation metadata after the move.

## Related Items

- **Follows**: `397-finish-compiler-stack-analysis-codegen-separation.md`
