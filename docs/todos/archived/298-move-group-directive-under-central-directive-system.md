---
title: 'TODO: Move group directive under central directive system'
priority: Medium
effort: 4-8h
created: 2026-03-13
completed: 2026-03-16
status: Completed
---

# TODO: Move group directive under central directive system

## Problem Description

The editor directive refactor moved most editor-only directives under `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`, with:

- centralized directive comment parsing in `directives/utils.ts`
- per-directive ownership of argument interpretation
- directive-owned block/widget contributions

`@group` is still an outlier. Its parsing and derived behavior remain in the older group feature area instead of following the central directive path.

That creates an unnecessary split:

- most directives use one parsing model
- `@group` still uses separate parsing code
- future directive cleanup has to remember this special case

It also means malformed `; @group` handling is not aligned with the newer rule used by other directives: if required arguments are missing, the directive should be ignored.

## Proposed Solution

Move `; @group` onto the same directive architecture as the other editor directives.

The intended end state is:

- directive comment parsing stays centralized in `directives/utils.ts`
- a new `directives/group/` folder owns group directive interpretation
- group-related block metadata is derived from parsed directives, not from a separate raw-code parser
- invalid `; @group` forms with missing required arguments are ignored

This TODO is about architectural alignment, not about changing group behavior.
Existing semantics such as the optional `nonstick` mode should be preserved.

## Anti-Patterns

- Do not add another directive-specific raw comment parser for `@group`.
- Do not move all group behavior under `directives/` if it is not actually directive-driven.
- Do not change grouped drag semantics as part of this refactor.
- Do not mix this refactor with sticky/nonstick feature changes.

## Implementation Plan

### Step 1: Add a directive-owned group data helper
- Create `features/directives/group/`.
- Add a small helper that interprets parsed `group` directives into typed group metadata.
- Require a group name argument and ignore malformed directives without one.

### Step 2: Rewire current group metadata derivation
- Replace the older group parser path used by code-block graphic derivation with the directive-owned helper.
- Keep current `groupName` and `groupNonstick` behavior unchanged.

### Step 3: Keep non-directive group behavior outside directives
- Leave grouped dragging, menu actions, and other runtime behavior in their existing feature areas unless they are directly directive-specific.
- Only migrate the directive parsing and derived metadata part.

### Step 4: Add tests and doc follow-up
- Add directive-folder tests for valid and malformed `@group` lines.
- Update directive contributor docs if the current examples imply `group` is still special-cased.

## Validation Checkpoints

- `npx nx run @8f4e/editor-state:test -- --runInBand`
- `npx nx run @8f4e/editor-state:typecheck`
- `rg -n "@group|groupName|groupNonstick|parseGroup" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `@group` comment parsing is handled through the shared directive parser.
- [ ] Group argument interpretation lives under `features/directives/group/`.
- [ ] Malformed `; @group` directives with missing required arguments are ignored.
- [ ] Existing grouped drag behavior and `nonstick` semantics remain unchanged.
- [ ] Editor-state tests still pass after the migration.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/group/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/docs/contributing-editor-directives.md`

## Risks & Considerations

- **Boundary drift**: only the directive-derived part should move; generic group behavior should stay where it belongs.
- **Behavior regression**: grouped drag and menu features depend on `groupName` / `groupNonstick`, so the derived metadata must remain identical.
- **Scope creep**: this should stay a refactor, not a redesign of grouping features.

## Related Items

- **Related**: `docs/todos/220-add-code-block-grouping-directive-and-modifier-drag-behavior.md`
- **Related**: `docs/todos/223-add-group-wide-ungroup-context-menu-action.md`
- **Related**: `docs/todos/224-add-sticky-group-mode-via-group-directive.md`
- **Related**: `docs/todos/235-replace-sticky-with-nonstick-group-override-and-menu-actions.md`

## Notes

- This TODO exists because the directive refactor centralized most editor directives, but `@group` was intentionally deferred.
- The desired model is the same as the other editor directives: central syntax parsing, directive-local argument interpretation, shared derived block state.