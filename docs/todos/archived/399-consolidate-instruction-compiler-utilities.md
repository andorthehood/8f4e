---
title: 'TODO: Consolidate instruction compiler utilities'
priority: Low
effort: 1-2h
created: 2026-05-12
status: Completed
completed: 2026-05-12
---

# TODO: Consolidate instruction compiler utilities

## Problem Description

Several helpers used only by instruction compilers lived in the shared compiler `src/utils/` folder. That made the package structure blur the boundary between general compiler utilities and codegen/instruction-compiler-only support code.

The arithmetic and comparison instruction compilers also repeated the same two-operand stack flow, typed opcode selection, and result-stack bookkeeping.

## Proposed Solution

Move instruction-compiler-only helpers under `packages/compiler/src/instructionCompilers/utils/` and extract the repeated numeric binary instruction compiler pattern into a small shared factory.

Completed changes:

- Added `createNumericBinaryCompiler` for shared two-operand numeric instruction codegen.
- Moved `saveByteCode` into its own instruction-compiler utility file.
- Removed unused `calculateWordAlignedSizeOfMemory` and its test coverage.
- Moved `internalResources`, `knownIntegerValue`, `stackAddressMetadata`, `addressClamp`, and `memoryAccessGuard` under `instructionCompilers/utils`.
- Updated instruction compiler imports, including nested `push` handlers.

## Success Criteria

- [x] Instruction-compiler-only helpers live under `packages/compiler/src/instructionCompilers/utils/`.
- [x] `saveByteCode` has its own focused utility file.
- [x] Unused `calculateWordAlignedSizeOfMemory` is removed.
- [x] Shared arithmetic/comparison codegen flow is centralized.
- [x] Compiler typecheck and tests pass.

## Affected Components

- `packages/compiler/src/instructionCompilers/`
- `packages/compiler/src/instructionCompilers/utils/`
- `packages/compiler/src/instructionCompilers/utils/createNumericBinaryCompiler.ts` - new shared helper for numeric binary instruction compilers.
- `packages/compiler/src/utils/`

## Validation Checkpoints

- `npx eslint --fix packages/compiler/src/instructionCompilers`
- `npx nx run compiler:typecheck`
- `npx nx run compiler:test`
- `git diff --check`

## Notes

- Archived retroactively for bookkeeping after the refactor was completed.
