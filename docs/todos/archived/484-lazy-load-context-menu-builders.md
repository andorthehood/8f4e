---
title: 'TODO: Lazy-load context-menu builders'
priority: Medium
effort: 4-8h
created: 2026-09-06
issue: null
status: Cancelled
completed: 2026-09-07
---

# TODO: Lazy-load Context-Menu Builders

## Problem Description

The context-menu effect statically imports all menu builders, including the main, module, category, and favorites menus.
Every editor downloads these builders before a menu is opened, even though the menu-opening handlers already support
asynchronous work.

## Proposed Solution

Keep lightweight event registration available at startup and dynamically load menu builders on first use. Start with
one shared builders chunk; split individual menus only if production measurements justify the extra requests.

## Implementation Plan

1. Measure the current menu contribution and inspect its shared dependencies.
2. Replace the eager builders import with a cached asynchronous loader used by context-menu, submenu, and back actions.
3. Ensure opening, replacing, or closing menus while loading cannot apply stale results. Handle errors and editor disposal.
4. Compare production initial bytes and first-open latency, and verify later opens reuse loaded code.

## Success Criteria

- [ ] Menu builders are absent from the initial static dependency graph and load on first menu use.
- [ ] Context menus, favorites, categories, submenus, and back navigation retain their behavior.
- [ ] Rapid opens, dismissal, selection changes, and disposal cannot reopen or overwrite menus with stale results.
- [ ] Failed loading is handled and permits a subsequent attempt where recovery is possible.
- [ ] Existing placement, highlighting, and event propagation behavior remains intact.
- [ ] Production size and first-open latency measurements are recorded.

## Affected Components

- `packages/editor/packages/editor-core/packages/editor-state/src/features/menu/effect.ts`
- `packages/editor/packages/editor-core/packages/editor-state/src/features/menu/menus/`

## Risks & Considerations

Some builder dependencies may also be required by initial rendering or editor state, limiting savings. Avoid moving
shared helpers solely to inflate the apparent size of the deferred chunk. Keep any loading feedback proportionate to
the measured delay and respect disabled feature flags.

## Validation Checkpoints

- Run `npx nx run @8f4e/editor-state:test` and `npx nx run @8f4e/editor-state:typecheck`.
- Run `npx nx run @8f4e/editor-website:build` and inspect the initial dependency graph.
- Check delayed loading, load failures, rapid menu navigation, and editor disposal with focused tests.
- Manually compare first and subsequent menu opens in the production build.

## Related Items

- [TODO 483: Lazy-load WASM overlay rendering](../483-lazy-load-wasm-overlay-rendering.md).
- [TODO 486: Lazy-load editing features on entering edit mode](486-lazy-load-editing-features-on-edit-mode.md) — keep menus usable in view mode where currently allowed.

## References

- [Context-menu effect](../../packages/editor/packages/editor-core/packages/editor-state/src/features/menu/effect.ts)

## Notes

Identified through source inspection on 2026-09-06. This can be implemented independently of the edit-mode split.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
