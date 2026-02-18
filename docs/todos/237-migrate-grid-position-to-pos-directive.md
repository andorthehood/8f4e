# 237: Migrate Code Block Position to `@pos` Directive

## Goal

Move code block position persistence out of project `gridCoordinates` and into editor directive metadata:

```txt
; @pos <x> <y>
```

Position is stored per block inside `code` and is the only persisted source of truth for block placement.

## Scope Decisions (Approved)

- Backward compatibility is **not required**.
- Project API/schema can change.
- During dragging:
  - runtime position updates continuously for UI (`x/y`),
  - `@pos` is **not** updated until drag ends.
- On drag end:
  - snap/finalize runtime position (`gridX/gridY`, normalized `x/y`),
  - update `@pos` once.
- Use `graphicHelper.selectedCodeBlockForProgrammaticEdit` when updating `@pos` programmatically.
- When parsing a project:
  - missing `@pos` defaults to `(0,0)`.
- When editing code:
  - only apply position to runtime state if `@pos` is properly formatted.

## Directive Rules

- Syntax: `; @pos <x> <y>`
- `x` and `y` are strict integers (allow negatives).
- Duplicate `@pos` lines in one block are treated as invalid for code-driven reposition.
- Canonical serialization format is exactly one directive line:
  - `; @pos ${gridX} ${gridY}`

## Architecture (Loop-Free by Design)

No safety flags; prevent loops by separating write responsibilities.

### Writers

- Runtime position (`gridX/gridY/x/y`) may be written only by:
  - project load parse,
  - code-edit parse (only when `@pos` is valid),
  - drag end finalize.
- Code text may be written only by:
  - user edits,
  - drag end `@pos` upsert.

### Non-writers

- Graphics/derivation/update passes must not write position or rewrite `@pos`.
- Parsing helpers are pure.

This keeps updates acyclic:
- drag end writes runtime position + code once,
- code-edit parse writes runtime position only,
- no reactive write-back from render subscribers.

## Data Model Changes

1. Project code block persistence
- Remove persisted `gridCoordinates` from project `codeBlocks`.
- Persist only:
  - `code: string[]`
  - optional `disabled: boolean`

2. Runtime code block state
- Keep runtime `gridX/gridY/x/y` in `CodeBlockGraphicData` for editor behavior/rendering.

## Behavioral Changes

1. Project load
- Parse each block `@pos`.
- If valid: initialize runtime grid/pixel position from directive.
- If missing: initialize to `(0,0)`.
- If malformed/duplicate: ignore and initialize to `(0,0)`.

2. Code edit handling
- On code changes, parse `@pos`.
- If valid: update runtime `gridX/gridY/x/y`.
- If invalid: do nothing to runtime position.

3. Drag handling
- `mousemove`: update runtime `x/y` only.
- `mouseup`: snap + finalize runtime `gridX/gridY/x/y`, then upsert canonical `@pos`.
- For grouped drags, do this for every moved block.
- Use `selectedCodeBlockForProgrammaticEdit` for each programmatic code update.

4. New/pasted/auto-generated blocks
- Ensure resulting block code contains canonical `@pos`.
- For pasted multi-blocks, preserve relative placement then write final canonical `@pos`.

5. Export
- Serialize without `gridCoordinates`.
- Export block code as-is (containing `@pos`).

## Implementation Checklist

- [ ] Add `@pos` parser utility (strict, duplicate detection, pure).
- [ ] Add `@pos` upsert utility (idempotent canonical writer).
- [ ] Update project import/population to initialize runtime position from `@pos` (default `(0,0)` if missing/invalid).
- [ ] Update code-edit path to apply runtime position only when `@pos` is valid.
- [ ] Update drag end flow to upsert `@pos` and use `selectedCodeBlockForProgrammaticEdit`.
- [ ] Keep drag move flow runtime-only (`x/y`) with no code writes.
- [ ] Update code block creation and any programmatic insertion paths to include canonical `@pos`.
- [ ] Update project export schema and serializer to remove `gridCoordinates`.
- [ ] Update type definitions for persisted `CodeBlock`.
- [ ] Update docs:
  - `packages/editor/docs/editor-directives.md` (`@pos` section),
  - project schema docs under project-export/import docs.

## Tests to Add/Update

- [ ] Import initializes from valid `@pos`.
- [ ] Import defaults to `(0,0)` when `@pos` missing.
- [ ] Import defaults to `(0,0)` when `@pos` malformed/duplicate.
- [ ] Code edit with valid `@pos` updates runtime position.
- [ ] Code edit with invalid `@pos` does not change runtime position.
- [ ] Drag move does not mutate code.
- [ ] Drag end mutates `@pos` once (canonical format).
- [ ] Group drag end updates all moved blocks’ `@pos`.
- [ ] Exported project blocks contain no `gridCoordinates`.
- [ ] Creation/paste paths include canonical `@pos`.

## Risks / Notes

- Any feature currently reading persisted `gridCoordinates` must be migrated to read runtime coordinates derived from `@pos`.
- Clipboard multi-block payload can continue using relative `gridCoordinates` internally for paste mechanics; this is separate from project persistence schema.
- Ensure canonical formatting to avoid directive drift and noisy diffs.
