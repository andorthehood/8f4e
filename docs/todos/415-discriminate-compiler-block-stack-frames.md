---
title: 'TODO: Discriminate compiler block stack frames'
priority: Medium
effort: 4-8h
created: 2026-05-25
issue: https://github.com/andorthehood/8f4e/issues/684
status: Open
completed: null
---

# TODO: Discriminate compiler block stack frames

## Problem Description

`BlockStack` currently stores one broad frame shape where fields such as `mapState` and `loopCounterLocalName` are optional. Code that is already scoped to a map or loop block still has to use non-null assertions or repeated top-frame checks.

This makes compiler-owned impossible states look possible to TypeScript and scatters defensive checks across stack analysis and codegen.

The overall goal is to use strict types for block-state facts once the compiler has established them. A map frame without `mapState` is not a valid internal state; a loop frame is the only frame that can carry loop-specific metadata. These distinctions should be encoded in the block frame union rather than rediscovered through runtime checks.

## Proposed Solution

Turn block frames into a discriminated union keyed by `blockType`:

- map frames require `mapState`;
- loop frames carry loop counter metadata when present;
- generic, condition, module, function, and constants frames only expose fields they can actually have.

Add typed helpers for reading or popping expected block frames while preserving user-facing semantic errors when the source program closes the wrong block.

The important distinction is between validating user block structure and defending against malformed compiler-owned frames. The former remains runtime behavior; the latter should become a type-system guarantee.

## Implementation Plan

### Step 1: Define Frame Union

- Replace the single broad `BlockStack[number]` shape with named frame types.
- Keep shared result-shape fields in a base frame type.
- Require `mapState` on map frames.

### Step 2: Add Typed Helpers

- Add `peekExpectedBlock(...)` and/or `popExpectedBlock(...)` helpers that narrow by `BlockType`.
- Keep `popBlock(...)` for generic behavior where no type-specific fields are needed.

### Step 3: Update Map and Loop Consumers

- Update `map`, `default`, `mapEnd`, `loopIndex`, and stack-analysis map/loop paths to use the narrowed helpers.
- Remove `mapState!`, `loopBlock!`, and similar assertions where the helper proves the shape.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Check `rg -n "mapState!|loopBlock!|popBlock\\(context\\)!" packages/compiler/src`.

## Success Criteria

- [ ] Map block consumers can access `mapState` without non-null assertions.
- [ ] Loop metadata consumers are narrowed through a typed frame.
- [ ] Invalid block nesting still produces the same compiler errors.
- [ ] Compiler tests and typechecks pass.

## Affected Components

- `packages/compiler-spec/src/semantic.ts`
- `packages/compiler/src/utils/blockStack.ts`
- `packages/compiler/src/stackAnalysis/analyzeInstruction.ts`
- `packages/compiler/src/instructionCompilers/map.ts`
- `packages/compiler/src/instructionCompilers/mapEnd.ts`
- `packages/compiler/src/instructionCompilers/default.ts`
- `packages/compiler/src/instructionCompilers/loopIndex.ts`

## Risks & Considerations

- **Behavior risk**: Typed helpers must preserve current error codes for bad block nesting.
- **Scope creep**: Do not refactor block semantics beyond the frame shape unless needed for typing.
- **Wrong-goal risk**: Do not move map/loop checks deeper into codegen as extra guards. Prefer helpers and discriminated frame types that prove the expected shape at the boundary.
- **Dependency**: This can be deployed independently from context splitting.

## Related Items

- **Related**: `397-finish-compiler-stack-analysis-codegen-separation.md`
- **Related**: `409-track-block-context-flags-during-stack-analysis.md`
