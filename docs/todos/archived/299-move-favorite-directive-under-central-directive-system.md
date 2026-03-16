---
title: 'TODO: Move favorite directive under central directive system'
priority: Medium
effort: 2-4h
created: 2026-03-13
completed: 2026-03-16
status: Completed
---

# TODO: Move favorite directive under central directive system

## Problem Description

Most editor-only directives now live under `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/` and use:

- centralized comment parsing in `directives/utils.ts`
- directive-local argument interpretation
- shared derived block state

`@favorite` is still handled through the older favorites feature path instead of the directive system.

That keeps one simple editor directive outside the architecture now used by:

- `@disabled`
- `@home`
- `@pos`
- widget directives such as `@plot`, `@slider`, `@button`, and `@switch`

The current split is not a behavior bug, but it is inconsistent and makes the directive architecture harder to reason about.

## Proposed Solution

Move `; @favorite` under the same central directive system as the other editor directives.

The intended end state is:

- comment parsing remains centralized in `directives/utils.ts`
- a `directives/favorite/` folder owns `@favorite`
- the favorites feature consumes directive-derived metadata instead of a separate parser path
- malformed favorite forms can be handled consistently, though the canonical directive remains argument-free

This should be a small architectural cleanup, not a behavior change.

## Anti-Patterns

- Do not add a separate raw-line parser for `@favorite`.
- Do not couple favorites navigation/menu rendering to directive parsing details.
- Do not broaden the scope into favorites UX changes.

## Implementation Plan

### Step 1: Add directive-owned favorite metadata
- Create `features/directives/favorite/`.
- Add a small plugin that marks a block as favorite when `; @favorite` is present.

### Step 2: Rewire favorites derivation
- Replace the current favorites parser path with consumption of directive-derived block metadata.
- Keep current behavior unchanged for menu labels and navigation.

### Step 3: Add tests and docs
- Add directive-folder tests for `@favorite`.
- Update contributor docs if they still imply favorites are special-cased outside directives.

## Validation Checkpoints

- `npx nx run @8f4e/editor-state:test -- --runInBand`
- `npx nx run @8f4e/editor-state:typecheck`
- `rg -n "@favorite|favorite" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `@favorite` is parsed through the shared directive parser.
- [ ] Favorite directive logic lives under `features/directives/favorite/`.
- [ ] Favorites derivation no longer depends on a separate raw-code parser.
- [ ] Existing favorites behavior remains unchanged.
- [ ] Editor-state tests still pass after the migration.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/favorites/`
- `packages/editor/docs/contributing-editor-directives.md`

## Risks & Considerations

- **Over-refactoring**: this should stay a small consistency cleanup.
- **Behavior drift**: favorites menu/navigation behavior should not change.
- **Boundary clarity**: directive parsing should move, but higher-level favorites UI behavior can stay where it is.

## Related Items

- **Related**: `docs/todos/219-add-favorite-code-blocks-jump-menu-navigation.md`
- **Related**: `docs/todos/298-move-group-directive-under-central-directive-system.md`

## Notes

- This TODO exists because `@favorite` is now one of the remaining editor directives outside the shared directive architecture.
- It should be simpler than the `@group` migration because it has no widget or drag behavior attached to it.