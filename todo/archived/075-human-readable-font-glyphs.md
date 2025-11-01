---
title: 'TODO: Human-readable sprite font glyphs'
priority: Medium
effort: 2-3 days
created: 2025-10-31
status: Completed
completed: 2025-11-01
---

# TODO: Human-readable sprite font glyphs

## Problem Description

The 6×10 and 8×16 sprite fonts in `packages/editor/packages/sprite-generator` are currently authored as densely packed numeric bitmaps composed with utility helpers like `pad`, `same`, `mirr`, and `invert`. That representation is difficult to read, review, or hand-edit, which slows iteration on glyph designs and makes subtle mistakes hard to spot. The helper-driven composition also obscures the actual pixel layout, complicating code reviews or future contributor onboarding.

## Proposed Solution

- Replace the numeric bitmap definitions with ASCII-art glyphs that use `' '` and `'#'` to convey set pixels, keeping a 1:1 mapping with the current rendered output.
- Introduce a loader that converts the ASCII glyphs into the flattened `number[]` bitmaps expected by the rendering pipeline so downstream consumers remain unchanged.
- Provide a conversion script to migrate existing glyph data and to regenerate numeric fixtures for verification when fonts evolve.
- Drop the now-unnecessary helper utilities (`pad`, `same`, `mirr`, `invert`) once the ASCII-art pipeline is in place.
- Example glyph format to adopt:

```ts
const font6x10 = [
	[
		'        ',
		'   ##   ',
		'  #  #  ',
		' #    # ',
		' ###### ',
		' #    # ',
		' #    # ',
		'        ',
	],
];
```

## Implementation Plan

### Step 1: Catalogue current bitmap sources and helper behavior
- Inventory the 6×10 and 8×16 ASCII/glyph exports plus usages of `pad`, `same`, `mirr`, and `invert`.
- Document bit ordering, padding expectations, and any implicit mirroring/inversion so the ASCII loader can preserve behavior.
- No external dependencies.

### Step 2: Build conversion utilities and migrate font assets
- Author a script or module that reads the existing `number[]` bitmaps and emits ASCII glyph arrays; validate against a subset of glyphs.
- Introduce shared functions to convert ASCII glyphs back to numeric rows at runtime and swap the font modules to the new representation.
- Remove unused helper utilities and adjust imports.

### Step 3: Harden with tests and documentation
- Add unit tests for the ASCII→bitmap converter (bit order, blank rows, regression fixtures) and confirm sprite output parity.
- Document the regeneration workflow and update relevant README/test fixtures.
- Run `npm run lint`, `npm run test`, and the sprite-generator build to verify integrity.

## Success Criteria

- [ ] ASCII-art glyph definitions exist for both 6×10 and 8×16 fonts and glyph sheets.
- [ ] Automated tests verify the converter outputs match legacy bitmaps.
- [ ] Sprite generation renders identically post-migration (validated via existing tests or manual comparison).

## Affected Components

- `packages/editor/packages/sprite-generator/src/fonts/**` - Font asset definitions and helpers migrate to ASCII art.
- `packages/editor/packages/sprite-generator/src/font.ts` - Continues to consume flattened bitmaps; may need minor adjustments or doc updates.
- `packages/editor/packages/sprite-generator/tests/**` - Add coverage for the new converter and maintain regression checks.

## Risks & Considerations

- **Risk 1**: Misinterpreting bit order could subtly invert glyphs; mitigate with snapshot/regression tests comparing before/after numeric arrays.
- **Risk 2**: Runtime conversion might add startup cost; mitigate by keeping conversion minimal and possibly precomputing during build if needed.
- **Dependencies**: Requires access to both font sizes' current bitmap data for accurate conversion.
- **Breaking Changes**: None expected if numeric outputs remain identical; ensure conversions run during build/test to catch discrepancies early.

## Related Items

- **Blocks**: None.
- **Depends on**: None.
- **Related**: Consider referencing existing sprite-generator font TODOs if alignment is needed.

## References

- Internal utilities and existing font modules in `packages/editor/packages/sprite-generator/src/fonts`.
- Sprite generator architecture (`packages/editor/packages/sprite-generator/src/index.ts`).
- Existing canvas regression coverage via the web-ui Playwright screenshot suite (`packages/editor/packages/web-ui/screenshot-tests/font-color-rendering.*`) that exercises font rendering across all ASCII characters.

## Notes

- The conversion script should remain available (e.g., under `scripts/`) for future glyph editing sessions.
- Capture any follow-up work (such as visual diffs) in additional TODOs if necessary.
- Update log: Created 2025-10-31.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section.
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` to obtain the current date if needed).
