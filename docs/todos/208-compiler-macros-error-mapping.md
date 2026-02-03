---
title: 'TODO: Compiler Macro Expansion with Error Mapping'
priority: Medium
effort: 2-3d
created: 2026-02-02
status: Completed
completed: 2026-02-03
---

# TODO: Compiler Macro Expansion with Error Mapping

## Problem Description

The compiler currently has no macro/template feature. Users want reusable snippets without copy/paste, but errors must still map to the line where `macro <name>` is used. Without mapping, compiled-out macro lines would shift error positions and make debugging confusing.

## Proposed Solution

Add a preprocessing step in `@8f4e/compiler` that:
- Collects macro blocks defined with `defineMacro <name>` / `defineMacroEnd`.
- Expands `macro <name>` instructions into the macro body.
- Disallows nested or recursive macro expansion (including macro calls inside macro bodies).
- Preserves error attribution by mapping expanded lines back to the `macro <name>` call site using explicit naming like `callSiteLineNumber`.

Implementation should compile the expanded source while preserving original call-site line numbers in the AST so downstream compiler errors point to the call site.

### Alternative Approaches Considered

- **Keep macro definitions in AST and teach instruction compilers about them**: more intrusive, error mapping still required.
- **Post-process errors after compilation**: harder to ensure accuracy for all error types.

## Anti-Patterns (Optional)

- Expanding macros without preserving call-site line numbers (breaks error mapping).
- Allowing nested macro expansion in v1 (can lead to recursion and ambiguous mappings).
- Treating `defineMacro` as a normal instruction (should be compile-time only).

## Implementation Plan

### Step 1: Add macro expansion utilities
- Create a utility that parses source lines with `instructionParser` and handles comments.
- Collect `defineMacro <name>` blocks and validate:
  - Unique names (duplicate = error).
  - Must end with `defineMacroEnd` (missing end = error).
  - No `macro <name>` or `defineMacro` inside macro bodies (nesting not supported).
- Build an expanded list of `{ line, callSiteLineNumber }` (call-site line number for expanded lines).

### Step 2: Integrate expansion into compiler flow
- Update `compileToAST` (or add a new entry point) to accept expanded lines and use `callSiteLineNumber` as the AST `lineNumber`.
- Ensure both module and function compilation use the expanded source.
- Define compiler error codes for macro issues and surface them in `getError`.

### Step 3: Tests and validation
- Unit tests for expansion and mapping:
  - Simple expansion preserves call-site line numbers.
  - Missing macro or missing end throws expected errors.
  - Duplicate macro names and nested macros error correctly.
- Update parser/compiler tests if they depend on strict instruction lists.

## Validation Checkpoints (Optional)

- `npx nx run compiler:test`
- `rg -n "defineMacro|defineMacroEnd|macro " packages/compiler`

## Success Criteria

- [x] Macro blocks expand in all compiler entry points.
- [x] Errors inside expanded bodies report the `macro <name>` call-site line number.
- [x] Duplicate/missing macros and missing end lines surface clear errors.
- [x] No nested macro expansion is allowed (errors on nested use).
- [x] Tests cover expansion and line mapping behavior.

## Affected Components

- `packages/compiler/src/compiler.ts` - integrate macro expansion into AST build.
- `packages/compiler/src/errors.ts` - add macro-related error codes/messages.
- `packages/compiler/src/utils/` - new macro expansion helper.
- `packages/compiler/tests/` - new or updated tests for macro expansion/mapping.

## Risks & Considerations

- **Line mapping accuracy**: ensure `callSiteLineNumber` flows into AST line numbers for all errors.
- **Comment handling**: macro parsing should ignore comment-only lines.
- **Instruction parsing limits**: macro parsing should rely on `instructionParser` to stay consistent.
- **Backward compatibility**: ensure non-macro code compiles identically.

## Related Items

- **Related**: `docs/todos/183-add-macro-blocks-and-expansion.md` (editor-level macro blocks)

## Notes

- Token decision: `defineMacro <name>` / `defineMacroEnd` define a macro, `macro <name>` expands it.
- Naming preference: use `callSiteLineNumber` for mapping clarity.
