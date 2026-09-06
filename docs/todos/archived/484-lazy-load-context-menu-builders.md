---
title: 'TODO: Lazy-load context-menu builders'
priority: Medium
effort: 4-8h
created: 2026-09-06
issue: null
status: Completed
completed: 2026-09-06
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

- [x] Menu builders are absent from the initial static dependency graph and load on first menu use.
- [x] Context menus, favorites, categories, submenus, and back navigation retain their behavior.
- [x] Rapid opens, dismissal, selection changes, and disposal cannot reopen or overwrite menus with stale results.
- [x] Failed loading is handled and permits a subsequent attempt where recovery is possible.
- [x] Existing placement, highlighting, and event propagation behavior remains intact.
- [x] Production size and first-open latency measurements are recorded.

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

- [TODO 483: Lazy-load WASM background rendering](../483-lazy-load-wasm-background-rendering.md).
- [TODO 486: Lazy-load editing features on entering edit mode](../486-lazy-load-editing-features-on-edit-mode.md) — keep menus usable in view mode where currently allowed.

## References

- [Context-menu effect](../../../packages/editor/packages/editor-core/packages/editor-state/src/features/menu/effect.ts)

## Notes

Identified through source inspection on 2026-09-06. This can be implemented independently of the edit-mode split.

## Implementation Results

The effect now uses a shared, retryable dynamic-import promise. A request counter invalidates obsolete imports and
asynchronous builder results. Pointer listeners are installed before loading so dismissal works immediately; disposal
removes every listener and subscription. Selection, block collection, and feature-flag changes cancel pending work.
Submenu history commits with its items, and Back retains the parent entry for repeated navigation.

The deferred chunk contains the four builders, category-tree construction, and favorite derivation. Group lookup,
memory-connection checks, and tokenizer/language helpers remain shared with eager editor features. No shared helpers
were moved to increase the apparent savings.

### Production Measurements

Compared the existing working-tree production build before this change with the updated build using
`npx nx run @8f4e/editor-website:build`, Node 24.16.0, on 2026-09-06. Initial bytes count the entry and its transitive
static manifest imports, excluding workers and other dynamic assets. Gzip sizes use Node zlib's default level 6;
these are compressed artifact sizes, not measured HTTP transfer sizes.

| Measurement | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Initial static JavaScript | 290,289 B | 284,628 B | −5,661 B (1.95%) |
| Initial static JavaScript, gzip | 80,956 B | 79,822 B | −1,134 B (1.40%) |
| Deferred menu chunk | — | 6,745 B | One additional request on first use |
| Deferred menu chunk, gzip | — | 1,890 B | — |
| First-open median | 0.405 ms | 30.035 ms | +29.630 ms |
| Subsequent-open median | 0.100 ms | 0.100 ms | No additional request |

Latency was measured in headless Chromium on localhost with no network/CPU throttling: five fresh browser contexts
per build, the default view-mode project, and an idle test runner. Timing starts when a canvas context-menu event is
dispatched and ends when the built items are assigned; it excludes physical input and display latency. First-open
ranges were 0.380–0.495 ms before and 20.840–31.250 ms after. These local measurements are not a remote-network
latency guarantee. The measured delay did not justify adding a loading indicator or splitting individual menus.

The editor-state manifest identifies `src/features/menu/menus/index.ts` as a dynamic entry. The website emits it as
`assets/chunks/index-W6nz288H-vfNgkadS-CfqQs81u.js`; it imports shared helpers from the main entry and is absent from
that entry's static graph. Browser request logs showed exactly one menu-chunk request on first use in every fresh
context, with none at startup or on subsequent opens. Before/after screenshots of the main menu were identical.

### Validation Results

- `npx nx run @8f4e/editor-state:test`: 154 files, 1,131 tests passed.
- `npx nx run @8f4e/editor-state:typecheck`: passed.
- `npx nx run @8f4e/editor-website:build`: passed.
- Biome checks passed for changed TypeScript files.
- Focused tests cover deferred imports, shared promises, retry after failure, stale failures/results, rapid replacement,
  dismissal, selection changes (including restoration), disposal, feature flags, module actions, and nested Back history.
- Production browser checks used real pointer interactions for view-mode favorites, three category levels, repeated
  Back to the main menu, module menus, and outside dismissal. A held menu-chunk request was dismissed before release;
  completing that request left the menu closed and a later open succeeded.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
