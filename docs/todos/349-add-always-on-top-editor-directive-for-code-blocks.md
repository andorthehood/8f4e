---
title: 'TODO: Add always-on-top editor directive for code blocks'
priority: Medium
effort: 3-6h
created: 2026-03-30
status: Open
completed: null
---

# TODO: Add always-on-top editor directive for code blocks

## Problem Description

The editor currently determines code block z-order entirely from the order of `graphicHelper.codeBlocks`.

That means:

- rendering order follows the array order
- hit-testing order follows the same array order
- clicking a block brings it to the absolute top by moving it to the end of the array

This is simple and coherent, but it does not allow users to mark a block as persistently top-most. That becomes limiting for overlay-style blocks, helper panels, or HUD-like blocks that should remain above ordinary code blocks even after the user clicks elsewhere.

## Proposed Solution

Add a new editor-only directive:

```txt
; @alwaysOnTop
```

This directive should mark a code block as belonging to a persistent top-most z-order partition.

The design constraint is:

- keep `graphicHelper.codeBlocks` as the single source of truth for z-order
- do not add a parallel render-order list or separate rendering pass

Instead, maintain the array as two contiguous segments:

- normal blocks
- always-on-top blocks

Within each segment, the existing click-to-front behavior should continue to work by moving the clicked block to the end of its own segment.

That means:

- clicking a normal block brings it above other normal blocks, but never above `@alwaysOnTop` blocks
- clicking an always-on-top block brings it above other always-on-top blocks
- rendering and hit-testing stay aligned because both still use `codeBlocks` order

## Anti-Patterns

- Do not introduce a separate render-order abstraction if the partitioned array approach is sufficient.
- Do not allow clicking a normal block to move it above an always-on-top block.
- Do not special-case rendering while leaving hit-testing on the old order.
- Do not mutate `codeBlocks` in ways that break the normal-block / always-on-top partition.

## Implementation Plan

### Step 1: Add directive parsing and block state
- Add an `alwaysOnTop` directive plugin under the central editor directive system.
- Treat `; @alwaysOnTop` as a boolean editor directive with no arguments.
- Extend block state and `CodeBlockGraphicData` with an `alwaysOnTop` flag.

### Step 2: Preserve a partitioned z-order in `codeBlocks`
- Update the click-to-front / drag selection path so reordering happens within the correct segment:
  - normal blocks move to the end of the normal segment
  - always-on-top blocks move to the end of the always-on-top segment
- Review other code paths that append, reorder, or rebuild `graphicHelper.codeBlocks` to ensure the partition remains valid.
- Keep render and hit-test behavior driven directly by the array order.

### Step 3: Verify interaction behavior
- Ensure clicking and dragging a normal block never places it above an always-on-top block.
- Ensure always-on-top blocks still behave normally relative to each other.
- Confirm that mixed scenes continue to render and hit-test consistently.

### Step 4: Document and test
- Add parser tests for the directive.
- Add behavioral tests for partitioned z-order and click-to-front behavior.
- Document the directive in the editor directive docs with at least one example.

## Validation Checkpoints

- `npx nx run editor:test`
- `npx nx run editor:typecheck`
- `rg -n "@alwaysOnTop|alwaysOnTop|codeBlocks = \\[" packages/editor/docs packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `; @alwaysOnTop` is recognized as an editor directive.
- [ ] Blocks with `@alwaysOnTop` always render above normal blocks.
- [ ] Hit-testing prefers always-on-top blocks over overlapping normal blocks.
- [ ] Clicking a normal block brings it only to the top of the normal-block segment.
- [ ] Clicking an always-on-top block brings it to the top of the always-on-top segment.
- [ ] Rendering and hit-testing continue to derive from `graphicHelper.codeBlocks` order rather than a parallel ordering system.
- [ ] The directive is documented in the editor directives docs.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/` - directive parsing and block-state derivation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/` - click-to-front behavior
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/finders/` - hit-testing order verification
- `packages/editor/docs/editor-directives.md` - directive documentation

## Risks & Considerations

- **Ordering drift**: any code path that rebuilds or reorders `graphicHelper.codeBlocks` must preserve the partition.
- **Implicit assumptions**: other features may currently assume "move to end" always means absolute top.
- **Mixed directives**: `@alwaysOnTop` should remain compatible with `@viewport`; a viewport-anchored block may also be top-most.
- **Multiple top blocks**: ordering among always-on-top blocks should remain stable and predictable.

## Related Items

- **Related**: `docs/todos/348-add-viewport-anchored-code-block-directive.md`
- **Related**: `docs/todos/302-add-jump-editor-directive.md`

## Notes

- This TODO captures the narrowed design decision: preserve `codeBlocks` array order as the only z-order source, and implement top-most behavior by maintaining an array partition rather than adding a separate render-order abstraction.
