---
title: 'TODO: Decouple Line Numbers from Syntax Highlighting'
priority: Medium
effort: 2-4h
created: 2026-01-13
status: Open
completed: null
---

# TODO: Decouple Line Numbers from Syntax Highlighting

## Problem Description

The editor currently prefixes code lines with line numbers before passing them into syntax highlighters. This forces the highlighters to account for line-number prefixes in their regexes (for example, skipping the line-start and matching `^\d+`), which makes the rules more complex and less accurate for real code at the start of a line. The coupling also makes it harder to evolve the highlighting logic independently of rendering concerns.

## Proposed Solution

Decouple line-number rendering from syntax parsing by only passing raw code lines into the syntax highlighters. Apply line-number coloring as a separate pass when building the render color matrix. This keeps the highlighters focused on code semantics and makes line-number styling explicit at the rendering stage.

## Implementation Plan

### Step 1: Update highlighters to expect raw code
- Remove line-number handling from `highlightSyntax8f4e` and `highlightSyntaxGlsl`.
- Loosen number regexes so numbers can be highlighted at the start of a line.
- Update in-source tests and snapshots to use code without line numbers.

### Step 2: Add line-number color pass in editor-state rendering
- Keep `codeWithLineNumbers` for `codeToRender` and layout calculations.
- Call syntax highlighters with `graphicData.code` and merge results into a new color matrix aligned to `codeWithLineNumbers` by offsetting indices.
- Apply line-number styling via a dedicated pass (`fontLineNumber` at line start, reset to `fontCode` after the prefix).

### Step 3: Extract helper and add targeted test
- Extract the merge/line-number logic into a helper in `pureHelpers/codeEditing` and keep `graphicHelper` focused on orchestration.
- Add a focused unit test for the merge/offset behavior.

## Success Criteria

- [ ] Highlighters operate on raw code without line numbers and simplified regexes.
- [ ] Line-number colors are applied in a separate pass and render correctly.
- [ ] Highlighting snapshots updated and passing.

## Affected Components

- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/highlightSyntax8f4e.ts` - Remove line-number parsing, adjust number regex, update tests.
- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/highlightSyntaxGlsl.ts` - Remove line-number parsing, adjust number regex, update tests.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` - Merge raw syntax colors with line-number rendering.
- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/__snapshots__/highlightSyntax8f4e.ts.snap` - Update snapshots.
- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/__snapshots__/highlightSyntaxGlsl.ts.snap` - Update snapshots.

## Risks & Considerations

- **Alignment risk**: Color offsets must line up with line-number prefixes to avoid miscolored characters.
- **Regression risk**: Start-of-line numeric literals should now highlight correctly; verify snapshots cover this.
- **Performance**: Extra merge pass should remain linear and lightweight.

## Related Items

- **Related**: `docs/todos/167-decouple-syntax-highlighting-for-glsl-blocks.md`

## Notes

- This change should not alter `codeToRender` output or grid measurements.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
