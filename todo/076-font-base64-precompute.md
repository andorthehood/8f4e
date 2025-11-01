---
title: 'TODO: Precompute font bitmaps as Base64 assets'
priority: Medium
effort: 8-12 hours
created: 2025-11-01
status: Open
completed: null
---

# TODO: Precompute font bitmaps as Base64 assets

## Problem Description

- Fonts in `@8f4e/sprite-generator` are stored as ASCII art arrays (`ascii.ts`, `glyphs.ts`) and converted into numeric bitmaps at runtime when the modules load.
- The raw ASCII glyph definitions are bundled alongside the derived bitmap arrays, inflating the production bundle and repeating trivial conversion work on every consumer load.
- Elevated bundle size and startup conversion translate into slower download and initialization times for the editor runtime.

## Proposed Solution

- Introduce a build-time generator that consumes the human-readable ASCII glyph sources and emits compact Base64-encoded binary payloads per font.
- Export metadata (character width/height, glyph count) with each payload and add a small runtime decoder that produces the existing `number[]` bitmap format.
- Extend Nx build/dev targets to run the generator before TypeScript compilation so only the Base64 artifacts ship in the bundle. Alternatives like keeping numeric arrays in source were rejected because they hinder readability of the glyphs.

## Implementation Plan

### Step 1: Add font generation tooling
- Create `tools/generate-font-bitmaps.mjs` (or similar) under the sprite-generator package to transform ASCII glyph sources to Base64 artifacts.
- Generated TypeScript modules (e.g. `fonts/8x16/generated.ts`) export the encoded payload and metadata.
- Depends on existing ASCII glyph source modules and `asciiToBitmap` helper.

### Step 2: Refactor runtime imports
- Update `src/index.ts` (and any other consumers) to import the generated modules and decode the Base64 payload into `number[]` bitmaps.
- Provide a shared `decodeFontBase64` utility to keep decoding logic centralized and typed.
- Depends on successful generation of the Base64 modules.

### Step 3: Wire generator into Nx workflows
- Add an Nx target (e.g. `nx run sprite-generator:generate-fonts`) and set `build`/`dev` targets to depend on it so artifacts exist before `tsc`.
- Document the workflow and ensure local `tsc --watch` or dev mode either triggers generation or instructs contributors to rerun when editing glyphs.
- Depends on generator script stability.

## Success Criteria

- [ ] Generated Base64 modules replace ASCII art imports in all runtime code paths.
- [ ] Production bundle excludes the raw ASCII glyph arrays and shrinks measurably.
- [ ] Vitest coverage validates parity between decoded Base64 bitmaps and the ASCII source conversion.

## Affected Components

- `packages/editor/packages/sprite-generator` - Gains generator tooling, new artifacts, and updated imports.
- `packages/editor/packages/sprite-generator/src/index.ts` - Switches to Base64-sourced bitmaps.
- `packages/editor/packages/sprite-generator/src/fonts/*` - ASCII sources become author-only; generated modules hold runtime data.

## Risks & Considerations

- **Risk 1**: Generator drift from ASCII sources if artifacts are not kept in sync; mitigate with Nx dependency wiring and watch docs.
- **Risk 2**: Base64 decoding differences between Node/browser environments; mitigate by using `Uint8Array` and tested helpers.
- **Dependencies**: Requires Node tooling (no additional deps expected) and consistent ASCII glyph formatting.
- **Breaking Changes**: None expected if decoding preserves existing bitmap structure.

## Related Items

- **Blocks**: None.
- **Depends on**: None.

## References

- [Existing ASCII converter utility](packages/editor/packages/sprite-generator/src/fonts/ascii-converter.ts)
- [Nx target configuration](packages/editor/packages/sprite-generator/project.json)
- [MDN Base64 encoding/decoding guidance](https://developer.mozilla.org/en-US/docs/Glossary/Base64)

## Notes

- Ensure generated files are git-ignored if they should not be committed, or document regeneration commands if they are checked in.
- Consider adding a checksum output to detect accidental changes in generated artifacts.
- Update `docs/` or `README` with instructions for editing and regenerating fonts once implementation lands.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
