---
title: 'TODO: Skip macro expansion when blocks have no macro calls'
priority: Medium
effort: 4-8h
created: 2026-06-01
issue: null
status: Open
completed: null
---

# TODO: Skip Macro Expansion When Blocks Have No Macro Calls

## Problem Description

`compile()` calls `expandMacros()` for prototypes, modules, constants, and functions. `expandMacros()` then scans every source line looking for `macro <name>` calls.

This is unnecessary when there are no macro definitions at all, and it is also avoidable for blocks that the tokenizer/parser already knows contain no macro call instructions.

## Proposed Solution

Add a cheap early return for the obvious no-macro case, then consider parser-owned metadata for per-block skipping.

Immediate improvement:

- If `macroDefinitions.size === 0`, `expandMacros(module, macroDefinitions)` should return `module.code` without scanning.

Follow-up improvement:

- Track whether a parsed source block contains macro call instructions.
- Use tokenizer/parser metadata such as `containsMacroCall` or `macroCallLines` to skip macro expansion for blocks with no macro calls.
- Keep macro expansion before the final compiler AST parse, since macros can produce other instructions such as `shape`.

## Implementation Plan

### Step 1: Add No-Definitions Fast Path

- Update `packages/compiler/src/utils/macroExpansion.ts`.
- Return `module.code` immediately when `macroDefinitions.size === 0`.
- Add a focused unit test that verifies unchanged identity or at least unchanged output without scanning-sensitive behavior.

### Step 2: Evaluate Parser Metadata for Macro Calls

- Decide whether macro-call metadata belongs in project parsing, tokenizer AST parsing, or a macro-specific parse pass.
- Prefer tokenizer/parser metadata over project pre-parsing.
- Avoid compatibility shims and fallback source scans.

### Step 3: Use Metadata in `compile()`

- Skip `expandMacros()` for source blocks known to have no macro calls.
- Preserve macro-produced shape behavior and existing macro diagnostics.

## Success Criteria

- [ ] `expandMacros()` does not scan source lines when `macroDefinitions.size === 0`.
- [ ] Blocks with no macro calls avoid the macro expansion pass when metadata is available.
- [ ] Macro expansion behavior and diagnostics remain unchanged.
- [ ] Compiler coverage metrics show reduced entered functions/ranges for projects without macros.

## Affected Components

- `packages/compiler/src/utils/macroExpansion.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/packages/tokenizer/src/parser.ts`
- `packages/compiler-spec/src/ast.ts`
- `packages/compiler/src/utils/macroExpansion.test.ts`

## Risks & Considerations

- **Macro-produced instructions**: Macro expansion must still happen before parsing final module semantics when a block has macro calls.
- **Metadata ownership**: Do not reintroduce project-level preparse flags. The parser should own instruction-level metadata.
- **No compatibility burden**: The software has not been released yet, so update internal APIs directly and do not add compatibility shims.

