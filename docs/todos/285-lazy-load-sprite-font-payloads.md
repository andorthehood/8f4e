---
title: 'TODO: Lazy-load Sprite Font Payloads'
priority: Medium
effort: 4-8h
created: 2026-02-25
status: Open
completed: null
---

# TODO: Lazy-load Sprite Font Payloads

## Problem Description

The sprite generator currently imports and decodes both font families (`8x16` and `6x10`) at module initialization time.
This eagerly includes all generated Base64 font payloads in startup paths even when a session only uses one font.

## Proposed Solution

Load and decode only the active font on demand, and lazily load alternate font payloads when needed.

High-level approach:
- Keep default font fast-path available.
- Move secondary font metadata behind dynamic imports.
- Cache decoded font bitmaps so each font is decoded once per session.

## Anti-Patterns (Optional)

- Do not re-decode the same font repeatedly on every render.
- Do not block startup on loading non-active fonts.
- Do not change visual output or sprite lookup contracts.

## Implementation Plan

### Step 1: Introduce lazy font loader
- Replace eager font map initialization with async/cached font loading helper.
- Ensure helper returns decoded bitmaps + dimensions in the existing shape.

### Step 2: Integrate with sprite generation path
- Update sprite generation callsites to await font payload availability when needed.
- Keep default path simple and deterministic.

### Step 3: Validate output parity and bundle impact
- Confirm generated sprites/lookups are unchanged for both fonts.
- Measure startup bundle reduction and verify no regressions.

## Validation Checkpoints (Optional)

- `npx nx run app:build -- --emptyOutDir`
- Compare startup `dist/assets/index-*.js` size before/after
- Visual/manual check with both `8x16` and `6x10` font configs
- `npx nx run-many --target=test --all`

## Success Criteria

- [ ] Non-active font payloads are not eagerly loaded at startup
- [ ] Font rendering output remains identical for both supported fonts
- [ ] Font switch path works correctly and remains stable
- [ ] Startup bundle size is measurably reduced

## Affected Components

- `packages/editor/packages/sprite-generator/src/index.ts` - eager font imports and initialization
- `packages/editor/packages/sprite-generator/src/fonts/*/generated/*.ts` - payload loading boundary
- Editor sprite-sheet creation flow that consumes sprite-generator output

## Risks & Considerations

- **First-switch latency**: first switch to non-default font may incur async delay.
- **Async integration risk**: sprite generation call chain may need async-safe updates.
- **Breaking Changes**: none expected if output and API shape are preserved.

## Related Items

- **Related**: [283-lazy-load-example-modules-metadata.md](./283-lazy-load-example-modules-metadata.md)
- **Related**: [284-lazy-load-optional-runtimes.md](./284-lazy-load-optional-runtimes.md)
- **Related**: [076-precompute-font-bitmaps-as-base64-assets.md](./archived/076-precompute-font-bitmaps-as-base64-assets.md)

## References

- [sprite generator index](/Users/andorpolgar/git/8f4e/packages/editor/packages/sprite-generator/src/index.ts)
- [8x16 ascii payload](/Users/andorpolgar/git/8f4e/packages/editor/packages/sprite-generator/src/fonts/8x16/generated/ascii.ts)
- [6x10 ascii payload](/Users/andorpolgar/git/8f4e/packages/editor/packages/sprite-generator/src/fonts/6x10/generated/ascii.ts)

## Notes

- Baseline observation: generated font payload modules contribute to startup chunk because both families are eagerly imported.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
