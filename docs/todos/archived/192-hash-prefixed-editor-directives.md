---
title: 'TODO: Move editor-only directives to # and remove ignoredKeywords'
priority: Medium
effort: 4-6h
created: 2026-01-21
status: Completed
completed: 2026-01-21
---

# TODO: Move editor-only directives to # and remove ignoredKeywords

## Problem Description

Editor-only instructions (`debug`, `button`, `switch`, `offset`, `plot`, `piano`, `scan`) are currently passed to the compiler via `environmentExtensions.ignoredKeywords`. This creates an awkward coupling between editor UI directives and the 8f4e language and keeps extra filtering logic inside the compiler. The intent is to make editor directives explicit, keep the compiler surface minimal, and avoid hidden ignore lists.

## Proposed Solution

Adopt `#`-prefixed directives for editor-only instructions, where `#` is:
- **A comment marker for the compiler**, identical to `;` (lines starting with `#` are comments; trailing `# ...` is also ignored after an instruction).
- **An instruction token for the editor**, meaning editor directives are written as `# debug ...`, `# plot ...`, etc.

Remove the `ignoredKeywords` API and logic from the compiler entirely.

Key decisions (no changes in behavior beyond these):
- **No backward compatibility**: bare `debug/plot/switch/...` lines should become compiler errors until migrated to `# ...`.
- **Compiler comment behavior**: `#` behaves the same as `;` (line-start comment and inline comment after an instruction).
- **Syntax highlighting**: treat `#` as a comment marker (same as `;`).

## Implementation Plan

### Step 1: Compiler parsing + API cleanup
- Update `packages/compiler/src/syntax/isComment.ts` to treat `#` like `;` for line-start comments.
- Update `packages/compiler/src/syntax/instructionParser.ts` to ignore trailing `# ...` comments (same behavior as `;`).
- Remove `environmentExtensions.ignoredKeywords` from:
  - `packages/compiler/src/types.ts` (`CompileOptions`)
  - `packages/compiler/src/compiler.ts` (`compileToAST` filter)
  - `packages/compiler/AGENTS.md` example usage
  - All compiler tests that pass `ignoredKeywords`
- Update any downstream compile callers to stop passing `environmentExtensions`.

### Step 2: Editor parsing and UI logic
- Update editor directive parsers to treat `instruction === '#'` and use `args[0]` as the directive keyword:
  - `packages/editor/packages/editor-state/src/features/code-blocks/features/debuggers/codeParser.ts`
  - `.../buttons/codeParser.ts`
  - `.../switches/codeParser.ts`
  - `.../bufferPlotters/codeParser.ts`
  - `.../bufferScanners/codeParser.ts`
  - `.../pianoKeyboard/codeParser.ts`
  - `.../graphicHelper/positionOffsetters.ts`
  - `.../graphicHelper/gaps.ts`
- Update syntax highlighting to treat `#` as comment marker:
  - `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts`

### Step 3: Migrate content, tests, and examples
- Replace editor directives with `#`-prefixed versions across:
  - `src/examples/modules/**`
  - `src/examples/projects/**`
  - `packages/editor/packages/editor-state/src/features/**/__tests__/**`
  - `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts` test data
  - `src/__tests__/exampleProjects.test.ts` (compiler options cleanup)
- Update any snapshots affected by code line changes.

## Success Criteria

- [ ] Compiler no longer exposes or consumes `ignoredKeywords`.
- [ ] `#`-prefixed directives are ignored by compiler and parsed by editor features.
- [ ] All examples and tests compile without errors using `#` directives.
- [ ] Syntax highlighter treats `#` as a comment marker like `;`.

## Affected Components

- `packages/compiler/src/syntax/isComment.ts` - add `#` comment detection
- `packages/compiler/src/syntax/instructionParser.ts` - ignore trailing `#` comments
- `packages/compiler/src/compiler.ts` - remove ignoredKeywords filtering
- `packages/compiler/src/types.ts` - remove `environmentExtensions.ignoredKeywords`
- `packages/compiler/AGENTS.md` - update API docs
- `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts` - remove ignoredKeywords option
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/codeParser.ts` - parse `#` directives
- `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts` - `#` comment highlighting
- `src/examples/**` - migrate directives to `# ...`
- `packages/**/__tests__/**` - migrate directives and update snapshots

## Risks & Considerations

- **Breaking change**: any un-migrated editor directive will become a compiler error.
- **Parser alignment**: editor parsers must interpret `#` while compiler ignores those lines entirely.
- **InstructionParser tests**: if `instructionParser` is extended for `#` inline comments, update editor tests that assert current behavior.

## Related Items

- **Related**: `docs/todos/169-toggle-position-offsetters.md` (uses `offset` directives)

## Notes

- This decision intentionally decouples editor directives from the 8f4e language.
- No backward compatibility or transition period.
