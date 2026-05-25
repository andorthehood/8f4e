---
title: 'TODO: Move compiler analysis metadata into instruction specs'
priority: Medium
effort: 1-2d
created: 2026-05-20
issue: null
status: Done
completed: 2026-05-25
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

- [x] Add narrowly scoped analysis metadata types to `packages/compiler-spec`.
- [x] Keep the metadata declarative and instruction-agnostic.
- [x] Avoid strategy callbacks or instruction-specific config names that just move code into data.

### Step 2: Move Fixed Stack Effects

- [x] Convert simple fixed-effect instructions to read stack behavior from the spec.
- [x] Cover comparisons, casts, stack manipulation, loads/stores, and other instructions that only consume and produce fixed stack shapes.
- [x] Preserve custom arithmetic analysis where integer/address metadata derivation remains algorithmic.

### Step 3: Move Block Close Metadata

- [x] Move generic block-close shape into the specs for instructions such as `else`, `blockEnd`, `loopEnd`, and `ifEnd`.
- [x] Keep custom function and map result validation logic explicit unless a genuinely reusable abstraction emerges.

### Step 4: Move Memory Operation Metadata

- [x] Move memory access width, operation kind, address operand role, and produced value type into the instruction specs.
- [x] Use the same spec metadata from stack analysis and code generation where possible.
- [x] Remove duplicated memory maps once the spec becomes the source of truth.

### Step 5: Leave Dynamic Algorithms Explicit

- [x] Keep `call`, `return`, and function-end signature logic in compiler code.
- [x] Keep map-specific row/default/selection analysis in compiler code.
- [x] Reconsider these only after a more generic abstraction becomes obvious from repeated behavior.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Confirm compiler architecture boundary tests still pass.
- Confirm editor tooltip stack signatures continue to render from instruction specs.

## Success Criteria

- [x] Generic fixed stack effects are read from instruction specs.
- [x] Generic block close behavior is read from instruction specs.
- [x] Generic memory operation metadata is read from instruction specs.
- [x] `analyzeInstruction.ts` only keeps custom algorithmic cases where configuration would be too specific.
- [x] Code generation no longer maintains duplicate memory metadata that can live in the spec.
- [x] Tests are updated to match the new spec-first structure.

## Affected Components

- `packages/compiler-spec/src/instructionSpecs.ts`
- `packages/compiler/src/stackAnalysis/analyzeInstruction.ts`
- `packages/compiler/src/instructionCompilers/`
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

## Completion Notes

- Completed on 2026-05-25 by adding declarative `InstructionSpec.analysis` metadata for generic stack effects, block-close behavior, and memory operations.
- Stack analysis now resolves configured generic effects from instruction specs before falling back to custom algorithmic cases.
- Memory load/store/copy codegen now reads operation metadata from instruction specs; opcode builders and truly dynamic value-width choices remain in instruction compilers.
- Verified with `npx nx run compiler-spec:typecheck`, `npx nx run compiler:typecheck`, and `npx nx run compiler:test`.
