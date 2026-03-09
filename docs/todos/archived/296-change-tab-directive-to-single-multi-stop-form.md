---
title: 'TODO: Change tab directive to single multi-stop form'
priority: Medium
effort: 2-4h
created: 2026-03-09
status: Open
completed: 2026-03-09
status: Completed
---

# TODO: Change tab directive to single multi-stop form

## Problem Description

The newly implemented tab-stop feature currently interprets tab stops from repeated single-value directives such as:

```txt
; @tab 4
; @tab 8
```

The desired syntax has changed. A single directive should now be able to define all stops at once:

```txt
; @tab 12 34 54
```

If multiple `; @tab ...` directives appear in the same code block, the most recent valid directive should become active from that line onward and remain in effect until a later valid `; @tab ...` directive overrides it.

The current implementation and docs do not follow this new rule, so the behavior and documentation need to be updated.

## Proposed Solution

Change tab-stop parsing so that:
- `; @tab <position1> <position2> ...` defines the full active stop list
- all positions are interpreted as positive integer visual columns
- the active stop list for a given code line is taken from the most recent valid preceding `; @tab ...` directive in the same block
- malformed directives are ignored
- a later valid directive replaces the previously active stop list for subsequent lines

This keeps the visible feature set small and makes the saved source easier to read than many single-stop lines.

## Anti-Patterns

- Do not merge stops across multiple `; @tab` lines anymore.
- Do not treat tab stops as one block-global setting taken only from the final directive.
- Do not keep “all directives accumulate” behavior as a fallback.
- Do not silently accept floats or non-positive numbers as stops.
- Do not rewrite tabs into spaces as part of this change.

## Implementation Plan

### Step 1: Update parsing semantics
- Change tab-stop parsing to consume all arguments from one `; @tab ...` line.
- Treat the parsed result as the complete stop list for that directive.
- Track the most recent valid directive while walking lines in order.
- Apply the currently active stop list to each subsequent code line until another valid `; @tab ...` directive appears.

### Step 2: Update tests
- Replace parser tests that assume repeated single-stop accumulation.
- Add tests for:
  - `; @tab 12 34 54`
  - duplicate values within one directive
  - invalid directives being ignored
  - line-by-line override behavior where a later directive only affects following lines

### Step 3: Update docs
- Update editor directive docs to show the new syntax.
- Remove or correct any examples that imply one stop per directive.

### Step 4: Verify feature behavior
- Confirm rendering, width calculation, click placement, and caret movement still behave correctly when tab-stop state changes partway through a block.

## Validation Checkpoints

- `npx nx run @8f4e/editor-state:test`
- `npx nx run @8f4e/editor:test`
- `rg -n "@tab" packages/editor docs`

## Success Criteria

- [ ] `; @tab 12 34 54` parses as one directive containing three stops.
- [ ] Multiple `; @tab ...` lines no longer accumulate across lines.
- [ ] A valid `; @tab ...` directive affects its following lines until another valid directive overrides it.
- [ ] Invalid `; @tab ...` directives do not break tab rendering.
- [ ] Documentation matches the new syntax and semantics.
- [ ] Existing tab rendering and caret behavior still pass regression tests.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-editing/tabLayout.ts`
- `packages/editor/docs/editor-directives.md`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth.ts`

## Risks & Considerations

- **Behavior change**: This deliberately changes semantics from the currently shipped implementation, so examples and tests must be updated together.
- **Directive precedence**: The implementation needs explicit per-line state rules so “most recent preceding directive wins” is unambiguous.
- **Migration clarity**: Existing saved projects using repeated single-stop directives may behave differently after this change.

## Related Items

- **Follows**: `docs/todos/archived/294-add-editor-tab-stop-directive.md`
- **Related**: `docs/todos/295-unify-code-render-rows-and-width-derivation.md`

## Notes

- Requested follow-up on 2026-03-09 after initial tab-stop support was implemented.
- Revised directive syntax:

```txt
; @tab 12 34 54
```

- Revised precedence rule:
  - If multiple `; @tab ...` directives exist, the most recent valid directive becomes active from that line onward.
  - Earlier lines keep using the stops that were active when those lines were reached.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
