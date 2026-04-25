---
title: 'TODO: Dedupe font atlas rows for identical text colors'
priority: Medium
effort: 1-2h
created: 2026-03-14
status: Completed
completed: 2026-03-31
---

# TODO: Dedupe font atlas rows for identical text colors

## Problem Description

The sprite generator currently renders one full ASCII font row for every text color role, even when multiple roles resolve to the same color value.

Current behavior:
- each text role in `ColorScheme['text']` gets its own row in the sprite canvas
- font lookup positions are derived from role order, not from actual color values
- identical colors still produce duplicated atlas rows

Why this is a problem:
- the generated sprite atlas contains redundant font rows
- atlas space is wasted for themes that intentionally reuse colors across multiple text roles
- the current layout logic couples role identity to physical row allocation, which makes optimization impossible without refactoring

Impact:
- unnecessary canvas usage
- avoidable draw commands during sprite generation
- more rigid sprite layout logic than needed

## Proposed Solution

Change font atlas generation so text roles that share the same effective color also share the same physical row in the sprite canvas, while keeping the public lookup surface unchanged.

Desired behavior:
- `fontCode`, `fontErrorMessage`, `fontLineNumber`, and other role-specific lookups should still all exist
- if two or more roles use the same color, their lookups should point to the same row coordinates
- if colors differ, they should continue to map to distinct rows

High-level approach:
- compute a font layout from the runtime `colors` object rather than from a fixed role order alone
- render one row per unique color value
- preserve a role-to-row mapping so the consumer-facing lookup map remains stable

Likely implementation shape:
- add a helper in `packages/editor/packages/sprite-generator/src/font.ts` that builds:
  - `rowsByRole: Record<keyof ColorScheme['text'], number>`
  - `uniqueRows: Array<{ color: string; roles: Array<keyof ColorScheme['text']> }>`
- update `generateFonts(...)` to render only `uniqueRows`
- update font lookup generation so every role still resolves to a lookup record, but duplicate-color roles reuse the same `y` position

Likely API implication:
- `generateLookups(characterWidth, characterHeight)` will need access to the runtime text color map
- that likely means changing it to `generateLookups(characterWidth, characterHeight, colors)`

## Anti-Patterns

- Do not remove or rename existing public lookup keys such as `fontCode` or `fontErrorMessage`.
- Do not make consumers aware of deduplication; this should stay an internal atlas optimization.
- Do not assume different roles must always map to different rows.
- Do not dedupe purely by role name ordering; deduplication must be driven by actual effective color values.
- Do not hardcode special-case aliases for only a subset of text roles.

## Implementation Plan

### Step 1: Refactor font layout calculation
- Extract the current implicit row assignment logic from `font.ts` into a helper that derives row positions from `ColorScheme['text']`.
- Produce both:
  - a stable role-to-row map
  - an ordered list of unique color rows to render
- Keep row ordering deterministic to avoid unnecessary screenshot churn.

### Step 2: Render only unique color rows
- Update `generateFonts(...)` in `packages/editor/packages/sprite-generator/src/font.ts` so it iterates unique rows rather than every text role.
- Continue drawing the same ASCII strip format, but only once per unique color value.
- Keep character coordinates within a row unchanged so existing consumers remain compatible.

### Step 3: Preserve the public lookup map
- Update `generateLookups(...)` to accept the runtime text colors and assign `y` coordinates from the deduped row map.
- Ensure all existing lookup keys remain present even when they alias the same underlying row.
- Update `packages/editor/packages/sprite-generator/src/index.ts` to pass `colorScheme.text` into lookup generation.

### Step 4: Normalize equality semantics if needed
- Decide whether dedupe should be based on raw string equality or normalized color equivalence.
- Minimum implementation:
  - dedupe exact string matches only
- Better implementation:
  - normalize equivalent values such as `#fff` and `#ffffff` before comparing
- Document the chosen rule.

### Step 5: Update tests and docs
- Update unit tests that currently assume every text role has a distinct `y` row.
- Add tests that verify:
  - same-color roles share coordinates
  - different-color roles still do not
  - all public lookup keys are still returned
- Update any README or docs snippets that describe the font atlas behavior if they imply one row per role.

## Validation Checkpoints

- `rg -n "generateLookups|generateFonts|font[A-Z]|ColorScheme\\['text'\\]" packages/editor/packages/sprite-generator`
- `npx nx run sprite-generator:test`
- `npx nx run web-ui:typecheck`
- Optional targeted check:
  - create a fixture where `text.code` and `text.errorMessage` are equal and verify `spriteLookups.fontCode['A']` and `spriteLookups.fontErrorMessage['A']` have the same `y`

## Success Criteria

- [ ] The sprite generator renders one font row per unique text color, not one row per text role.
- [ ] `spriteLookups` still exposes the full existing role-based map.
- [ ] Roles with identical colors resolve to shared coordinates.
- [ ] Roles with different colors resolve to different coordinates.
- [ ] Tests cover both deduped and non-deduped cases.

## Affected Components

- `packages/editor/packages/sprite-generator/src/font.ts` - font row planning, rendering, and lookup generation
- `packages/editor/packages/sprite-generator/src/index.ts` - pass runtime text colors into lookup generation
- `packages/editor/packages/sprite-generator/tests/font.test.ts` - update row assumptions and add dedupe assertions
- `packages/editor/packages/web-ui` - indirect consumer of unchanged lookup keys; should not require behavior changes if the map stays stable

## Risks & Considerations

- **Equality semantics**: `'#fff'` and `'#ffffff'` are visually equal but string-different. Exact-string dedupe is simpler; normalized dedupe is more correct but adds parsing concerns.
- **Test expectations**: existing tests currently encode the assumption that different roles imply different rows. Those assertions will need to be narrowed.
- **Deterministic layout**: dedupe must still produce stable row ordering across runs for the same input theme.
- **API ripple**: if `generateLookups(...)` changes signature, all internal callers and tests need to be updated together.
- **Future extensibility**: the helper should support newly added text roles without special cases.

## Related Items

- **Related**: `docs/todos/archived/293-add-separate-color-for-non-decimal-literal-base-prefixes.md`

## Notes

- Relevant current behavior:
  - `packages/editor/packages/sprite-generator/src/font.ts` defines a fixed ordered list of text roles and assigns one row per role
  - `packages/editor/packages/sprite-generator/src/index.ts` currently generates lookups without access to runtime text colors
- This optimization should not change any consumer-facing lookup names.
- Estimated implementation size is small, but verification matters because layout changes can invalidate row-based assumptions in tests.
