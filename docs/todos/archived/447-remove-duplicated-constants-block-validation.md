---
title: 'TODO: Remove duplicated constants block validation'
priority: Medium
effort: 2-4h
created: 2026-06-01
issue: null
status: Completed
completed: 2026-06-01
---

# TODO: Remove Duplicated Constants Block Validation

## Problem Description

`parseConstantsAST()` currently walks every parsed constants AST line and manually rejects instructions that do not have `allowedInConstantsBlocks`.

That duplicates the existing instruction-spec validation path:

- `constants` pushes a constants block context.
- `validateInstruction()` rejects instructions inside constants blocks unless their instruction spec has `allowedInConstantsBlocks`.
- memory declarations call `validateInstruction()` via `applyMemoryDeclarationLine()`, and their shared spec is scoped to modules, so they are already rejected inside constants blocks.

The extra loop makes constants blocks a special case in `compile()` and adds avoidable AST-line work after tokenization.

## Proposed Solution

Remove the manual constants-block content loop from `parseConstantsAST()` and let the existing semantic/stack validation path own the rule.

Keep the block-type assertion:

```ts
if (ast.type !== 'constants') {
	throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
}
```

Delete only the duplicated per-line `allowedInConstantsBlocks` validation.

## Implementation Plan

### Step 1: Remove the Manual Loop

- Update `packages/compiler/src/index.ts`.
- Delete the `for (const line of ast.lines)` block in `parseConstantsAST()`.
- Remove imports that become unused.

### Step 2: Preserve Error Coverage

- Keep existing constants error fixtures.
- Confirm `non-const-inside-constants-block.error.8f4e` still fails with `INSTRUCTION_NOT_ALLOWED_IN_BLOCK`.
- Confirm memory declarations inside constants blocks are still rejected.

### Step 3: Verify Compiler Behavior

- Run focused compiler error fixtures and compiler tests.
- Check that diagnostics still point at the offending instruction.

## Success Criteria

- [x] `parseConstantsAST()` no longer performs per-line constants content validation.
- [x] The shared instruction-spec validation path still rejects invalid constants-block instructions.
- [x] Existing constants error fixtures pass unchanged or with only intentional diagnostic-source updates.
- [x] No compatibility shims or fallback validation paths are added.

## Affected Components

- `packages/compiler/src/index.ts`
- `packages/compiler/src/stackAnalysis/validateInstruction.ts`
- `packages/compiler/tests/errors/instructions/constants/`

## Risks & Considerations

- **Diagnostic timing**: The same invalid source may fail slightly later in compilation. That is acceptable if the diagnostic remains accurate.
- **Semantic coverage**: Make sure constants ASTs always enter the same semantic validation path before codegen completes.
- **No compatibility burden**: The software has not been released yet, so update internal APIs directly and do not add compatibility shims.
