---
title: 'TODO: Add Macro Code Blocks and Expansion'
priority: Medium
effort: 2-4d
created: 2026-01-18
status: Open
completed: null
---

# TODO: Add Macro Code Blocks and Expansion

## Problem Description

The editor currently has no macro facility for reusing code snippets across blocks. Users want to define macros in dedicated code blocks and reference them with an instruction before compiling program and config sources. Without this, repeated boilerplate must be copied into each block, and the compiler has no notion of reuse.

## Proposed Solution

Introduce a new code block type for macro definitions using `defmacro <name>` and `defmacroEnd`. Add a macro expansion step in editor-state that replaces `macro <name>` call sites with the macro body before invoking the program compiler or config compiler. Macro expansion should work in all block types. Duplicate macro names and missing macro references should be reported as errors in state. Nested/recursive macros are not supported initially. Compiler and config errors should be remapped to the call-site lines using a line-mapping built during expansion.

## Implementation Plan

### Step 1: Define macro block type and UI affordances
- Add `macro` to `CodeBlockType` and update block detection to recognize `defmacro` markers.
- Add optional menu entry and block label handling for macro blocks.
- Add a default template for new macro blocks (using `defmacro` markers).

### Step 2: Implement macro expansion with line mapping
- Collect `defmacro` blocks, extract bodies, and validate unique names.
- Expand `macro <name>` lines in all blocks, replacing a single line with the macro body.
- Build a mapping of expanded lines back to the call-site line for error attribution.
- Record duplicate/missing macro errors in state.

### Step 3: Integrate with program and config compilation
- Apply macro expansion before `compileCode` and before config block combination/compilation.
- Remap compiler/config errors using the expansion line mapping so errors point at call sites.
- Add tests for block detection, expansion behavior, missing/duplicate errors, and error mapping.

## Success Criteria

- [ ] Macro blocks are recognized and can be created with `defmacro` markers.
- [ ] `macro <name>` lines expand correctly in all block types.
- [ ] Duplicate or missing macros produce state errors without crashing compilation.
- [ ] Compiler/config errors map to macro call-site lines.
- [ ] Tests cover macro expansion and error handling.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Add `macro` block type.
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` - Detect `defmacro` blocks.
- `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts` - Expand macros before compile.
- `packages/editor/packages/editor-state/src/features/config-compiler` - Expand macros before combine/compile.
- `packages/editor/packages/editor-state/src/features/menu/menus` - Optional macro menu items.

## Risks & Considerations

- **Line mapping**: Expansion changes line numbers; mapping must stay accurate for error attribution.
- **No nesting**: Macro bodies must not contain `macro` call sites; enforce or skip with errors.
- **Compilation latency**: Expansion adds a preprocessing step; keep it linear and cached if needed.
- **Backward compatibility**: Ensure existing blocks without macros behave identically.

## Related Items

- **Related**: `docs/todos/150-add-test-module-type.md` (block type additions and editor UI)

## Notes

- Macro syntax confirmed: `defmacro <name>` / `defmacroEnd` for definitions, `macro <name>` for usage.
- Macros allowed in all block types; duplicate and missing macros should emit errors in state.
- Nested/recursive macros are explicitly not allowed for the first version.

