---
title: 'TODO: Add Constants Code Blocks to Compiler'
priority: Medium
effort: 1-2d
created: 2025-12-30
status: Completed
completed: 2025-12-30
---

# TODO: Add Constants Code Blocks to Compiler

## Problem Description

The 8f4e language supports `const` declarations and `use` for importing constants, but there is no dedicated
top-level constants code block next to module and function blocks. This makes it harder to organize shared
constants as named namespaces that modules can import. The desired feature is a named constants block with
`constants` / `constantsEnd`, and only `const` instructions allowed inside.

## Proposed Solution

Introduce a new top-level constants block:

```
constants math
  const PI 3.14159
  const TAU 6.28318
constantsEnd
```

Modules can import a constants namespace using `use math`. The order of `use` statements should remain
last-applied wins when merging constants. Constants blocks must be named. When a constants block and a
module share the same name, their constants are merged using last-applied wins semantics. Only `const`
is allowed inside the block.

## Implementation Plan

### Step 1: Extend syntax rules and editor block detection
- Add a `constants` block type to `getBlockType` and tests in `packages/syntax-rules`.
- Update editor block classification to include constants blocks and pass them to the compiler.

### Step 2: Add compiler block instructions and validation
- Add `constants` and `constantsEnd` instruction compilers and a new block type.
- Enforce top-level-only usage and const-only content inside the block.

### Step 3: Integrate constants blocks into compiler namespaces
- Collect constants from constants blocks into the namespaces map.
- Allow constants blocks and modules to share names with last-applied wins semantics.
- Keep `use` merge behavior with last-applied wins.

### Step 4: Add tests for constants blocks
- Syntax-rules tests for block detection.
- Compiler tests for valid constants block usage, invalid instructions in the block, top-level-only validation,
  and name conflict errors.

## Success Criteria

- [x] `constants` / `constantsEnd` blocks are recognized and surfaced in the editor and compiler pipeline.
- [x] Constants blocks only accept `const` instructions and are top-level only.
- [x] `use <constantsName>` imports constants with last-applied wins semantics.
- [x] Constants blocks and modules can share names with last-applied wins semantics for namespace merging.
- [x] Tests cover syntax detection and compiler behavior.

## Affected Components

- `packages/syntax-rules/src/blockTypeDetection.ts`
- `packages/syntax-rules/tests/blockTypeDetection.test.ts`
- `packages/editor/packages/editor-state/src/effects/compiler.ts`
- `packages/compiler/src/instructionCompilers/index.ts`
- `packages/compiler/src/instructionCompilers`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/types.ts`
- `packages/compiler/tests`

## Risks & Considerations

- **Name merging**: constants blocks and modules with the same name will have their constants merged using last-applied wins semantics.
- **Editor integration**: ensure constants blocks are not treated as config blocks.
- **Breaking changes**: adding a new instruction pair requires sync with syntax and tests.

## Related Items

- **Related**: `docs/todos/056-one-time-init-blocks-language-feature.md`

## Notes

- Spec: named constants block, top-level only, const-only, constants blocks and modules can share names with last-applied wins semantics, `use` order wins.
