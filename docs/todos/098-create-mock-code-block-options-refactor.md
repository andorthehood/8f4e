---
title: 'TODO: Refactor createMockCodeBlock to options object'
priority: Medium
effort: 4-6h
created: 2025-11-22
status: Open
completed: null
---

# TODO: Refactor createMockCodeBlock to options object

## Problem Description

`createMockCodeBlock` currently accepts many positional overloads (string id, number x/y, optional width/height/offsets/cursorY), making call sites ambiguous and error-prone. Most new tests already pass an object, but legacy positional uses remain across editor-state tests and docs. The overload logic also hardcodes defaults (grid/minGridWidth/cursor) that are duplicated across branches, increasing maintenance cost and hiding defaults from callers.

## Proposed Solution

- Replace all positional overloads with a single options object parameter, exposing optional fields plus a small convenience key (`cursorY`) for cursor.y—no compatibility fallback to legacy positional parameters.
- Centralize defaults inside the helper (id/x/y/width/height/offsets/grid/minGridWidth/cursor/extras/lastUpdated) and merge with caller overrides.
- Update all call sites (tests/docs/example snippets) to the object form for consistency and readability, including web-ui consumers via `@8f4e/editor-state/testing`.

## Implementation Plan

### Step 1: Simplify helper signature and defaults
- Update `createMockCodeBlock` to accept only an options object (`Partial<CodeBlockGraphicData> & { cursorY?: number }`), remove positional branches, and derive grid/cursor defaults from provided x/y/width/offsets.
- Expected outcome: single-path helper with explicit defaults and clearer typing.
- Dependencies: none.

### Step 2: Migrate all call sites to options form
- Replace positional invocations across editor-state tests and web-ui screenshot tests with object arguments; ensure cursor/grid expectations stay the same (use `cursorY` where needed) and remove any reliance on legacy positional signature.
- Expected outcome: consistent, self-documenting usage everywhere; no reliance on old overload behavior.
- Dependencies: Step 1.

### Step 3: Update docs and validation
- Refresh `TESTING.md`, `testing.ts` examples, and any code comments to show the new signature; run targeted tests (`nx test editor-state` or focused vitest) to confirm behavior.
- Expected outcome: documentation aligned with implementation; tests verifying no regressions.
- Dependencies: Step 2; test runner availability.

## Success Criteria

- [ ] `createMockCodeBlock` accepts only an options object; no positional overload logic remains.
- [ ] All usages in editor-state and web-ui tests compile and pass with the new call style (no positional calls remain).
- [ ] Docs (`TESTING.md`, `testing.ts`) reflect the updated API and examples.

## Affected Components

- `packages/editor/packages/editor-state/src/helpers/testUtils.ts` - helper signature and defaults.
- `packages/editor/packages/editor-state/src/**/*.test.ts` - positional call sites updated.
- `packages/editor/packages/web-ui/screenshot-tests/**/*.ts` - screenshot test fixtures using the helper.
- `packages/editor/packages/editor-state/TESTING.md` and `packages/editor/packages/editor-state/src/testing.ts` - documentation/examples.

## Risks & Considerations

- **Breaks positional callers**: All sites must be migrated in one pass to avoid compilation errors; plan sweep carefully and avoid reintroducing compatibility shims that prolong mixed usage.
- **Default drift**: Cursor/grid/minGridWidth defaults must match old behavior; add explicit tests or verify existing ones cover these defaults.
- **Doc lag**: Inaccurate examples could mislead contributors; ensure docs update is part of the same change.

## Related Items

- **Depends on**: None.
- **Related**: 033 (Editor state effects testing), 039 (Shared testing utilities) for ensuring coverage of helper behavior.

## References

- Current helper implementation: `packages/editor/packages/editor-state/src/helpers/testUtils.ts`
- Usage examples: `packages/editor/packages/editor-state/TESTING.md`

## Notes

- Consider adding a small unit test for the helper itself after refactor to lock defaults (cursor, grid, minGridWidth) and `cursorY` behavior.
