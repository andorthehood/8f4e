---
title: 'TODO: Add ~ import alias to editor-state'
priority: Low
effort: 0.5-1h
created: 2026-01-14
status: Completed
completed: 2026-01-14
---

# TODO: Add ~ import alias to editor-state

## Problem Description

The editor-state package does not currently support a `~` import alias for resolving paths from `src/`.
Deep relative imports make the code harder to scan and are inconsistent with packages that already use aliases.
This slows navigation and increases churn when files move.

## Proposed Solution

Introduce a `~/*` alias that maps to `packages/editor/packages/editor-state/src/*` in both TypeScript and Vite/Vitest.
Keep the alias local to the package, mirroring existing workspace patterns that keep package-specific config in package configs.

## Implementation Plan

### Step 1: Define TypeScript alias mapping
- Add `paths` for `~/*` in `packages/editor/packages/editor-state/tsconfig.json`.
- Ensure the alias resolves to `src/*` and works with current `baseUrl`.
- Keep the change scoped to editor-state.

### Step 2: Add build alias for Vite
- Update `packages/editor/packages/editor-state/vite.config.ts` to add a `resolve.alias` entry for `~`.
- Use the same target as the TS alias to keep build-time resolution aligned.

### Step 3: Add test alias for Vitest
- Update `packages/editor/packages/editor-state/vitest.config.ts` to pass `resolve.alias` to the shared preset.
- Ensure tests can import via `~` without relative paths.

### Step 4: Validate and document
- Run `npx nx run editor-state:typecheck` and `npx nx run editor-state:test` (or `build`) to confirm resolution.
- Update `packages/editor/packages/editor-state/README.md` if alias usage should be documented.

## Success Criteria

- [ ] `~` imports resolve in editor-state TypeScript builds.
- [ ] `~` imports resolve in editor-state tests.
- [ ] Editor-state package build completes without alias resolution errors.

## Affected Components

- `packages/editor/packages/editor-state/tsconfig.json` - add `paths` alias
- `packages/editor/packages/editor-state/vite.config.ts` - add Vite alias
- `packages/editor/packages/editor-state/vitest.config.ts` - add Vitest alias
- `packages/editor/packages/editor-state/README.md` - document alias (optional)

## Risks & Considerations

- **Alias mismatch**: Vite/Vitest/TS must point to the same location to avoid runtime vs typecheck drift.
- **Breaking changes**: None expected; alias is additive.
- **Dependencies**: None beyond existing config helpers.

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: None

## References

- `packages/editor/packages/editor-state/tsconfig.json`
- `packages/editor/packages/editor-state/vite.config.ts`
- `packages/editor/packages/editor-state/vitest.config.ts`

## Notes

- Follow workspace guidance to keep package-specific aliases in package configs.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
