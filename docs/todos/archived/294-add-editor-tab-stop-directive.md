---
title: 'TODO: Add editor tab-stop directive support'
priority: Medium
effort: 1-2d
created: 2026-03-09
status: Open
completed: 2026-03-09
status: Completed
---

# TODO: Add editor tab-stop directive support

## Problem Description

The editor currently treats each code character as exactly one visible column. This prevents using literal tab characters with predictable alignment inside code blocks, even though the requested behavior fits the existing editor-directive model.

The requested feature is block-local tab stops declared with:

```txt
; @tab <position>
```

Without this feature:
- The editor cannot align code using tabs.
- Rendering, caret placement, and block width calculations drift if literal `\t` characters appear.
- The `Tab` key is not currently wired into text insertion.

## Proposed Solution

Support editor-only `; @tab <position>` directives and use them to expand literal tab characters to visual columns during layout.

Requested semantics:
- `position` is the visual column where the next character after the tab should land.
- The next applicable stop is the first declared stop strictly greater than the current visual column.
- Minimum tab advance is `1`.
- If there is no declared stop after the current visual column, fall back to visual advance `1`.
- Tabs remain literal `\t` characters in stored source text.

Implementation should introduce shared raw-index/visual-column mapping helpers and use them across rendering and editing behavior.

## Anti-Patterns

- Do not replace tabs with persisted spaces in source code.
- Do not implement tab expansion only in rendering; input and caret logic must use the same mapping.
- Do not add raw `@tab` lines without the `;` prefix.
- Do not treat `@tab` as a compiler directive; this is editor metadata only.

## Implementation Plan

### Step 1: Parse `; @tab` directives
- Add a parser for `; @tab <position>` in editor-state.
- Accept only strict positive integers.
- Ignore malformed, zero, or negative positions.
- Normalize valid positions into a sorted unique list per code block.

### Step 2: Add tab layout helpers
- Add utilities that can:
  - compute a line's visual width
  - map raw string index to visual column
  - map visual column to raw string index
  - expand a raw line into renderable cells
- Encode the requested rules:
  - next stop must be strictly greater than current visual column
  - minimum advance is `1`
  - fallback advance is `1`

### Step 3: Update rendering and sizing
- Update code-block graphic derivation to build `codeToRender` from tab-expanded visual cells.
- Update cursor x-position to use visual columns instead of raw column index.
- Update code-block width calculation to use visual width.
- Keep syntax-highlight alignment correct when one raw tab expands to multiple rendered cells.

### Step 4: Update pointer and caret behavior
- Update click-to-caret mapping so mouse x-coordinates resolve through visual-column mapping.
- Update horizontal and vertical caret movement to remain aligned with what is rendered.
- Keep row/gap handling unchanged except for raw/visual column conversion.

### Step 5: Update editing input behavior
- Intercept the `Tab` key in keyboard events and insert a literal `\t`.
- Keep insertion and deletion operating on raw string indices.
- Ensure backspace over a tab removes the raw tab in one operation even if it spans multiple visual columns.

### Step 6: Test and document
- Add unit tests for directive parsing and tab-column mapping helpers.
- Add editor-state tests for rendering width, click placement, and caret movement around tabs.
- Update editor directive docs with `; @tab <position>` syntax and the minimum/fallback rules.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `npx nx run editor:test`
- `rg -n "@tab|visual column|raw index|Tab" packages/editor docs`

## Success Criteria

- [ ] `; @tab <position>` directives are parsed as editor-only metadata.
- [ ] Literal tabs render to the next declared stop, with minimum visual advance `1`.
- [ ] Tabs fall back to visual advance `1` when no declared stop applies.
- [ ] Code-block width uses visual tab-expanded width instead of raw string length.
- [ ] Mouse click placement and caret movement remain aligned with rendered text.
- [ ] Pressing `Tab` inserts a literal tab character while editing.
- [ ] Tests cover parser behavior, mapping, rendering width, and caret interactions.
- [ ] Editor directive documentation includes the new directive and semantics.

## Affected Components

- `packages/editor/src/events/keyboardEvents.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth.ts`
- `packages/editor/packages/editor-state/src/features/code-editing/moveCaret.ts`
- `packages/editor/packages/editor-state/src/features/code-editing/type.ts`
- `packages/editor/packages/editor-state/src/features/code-editing/backSpace.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Cross-cutting assumptions**: The current editor assumes raw index equals visible column in several paths. Partial implementation will desynchronize rendering and interaction.
- **Highlight alignment risk**: Syntax colors are indexed by raw character position and need a propagation rule across expanded tab cells.
- **Performance risk**: Tab mappings may be recomputed often; prefer reusable per-line derived data where practical.
- **Compatibility risk**: Existing blocks without `; @tab` directives must continue to behave predictably, with tabs using fallback width `1`.

## Related Items

- **Related**: `docs/todos/240-add-align-row-context-menu-action.md`
- **Related**: `docs/todos/archived/293-add-separate-color-for-non-decimal-literal-base-prefixes.md`
- **Related**: `packages/editor/docs/editor-directives.md`

## Notes

- Requested behavior confirmed on 2026-03-09:
  - directive syntax is `; @tab <position>`
  - minimum tab length is `1`
  - fallback is `1` when no declared stop applies
- This TODO assumes `position` values are absolute visual columns within a line, not repeating interval sizes.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
