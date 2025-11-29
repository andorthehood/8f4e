---
title: 'Track Module Creation Index in Editor (Non-Persisted)'
priority: Medium
effort: 2-3h
created: 2025-11-29
status: Open
completed: null
---

# 105 - Track Module Creation Index in Editor (Non-Persisted)

## Problem Description

Currently, the editor's order of code modules is correlated with their Z-index (visual stacking). For the memory layout and compiler pipeline, we want a different ordering: newly added code modules should appear at the end of the list we send to the compiler so they can be appended at the end of memory. This requires a stable "creation order" per module that is independent of visual Z-index; it only needs to preserve relative order and does not need to be continuous or gap-free (deletions can leave holes).

We do not want this creation order to be part of the persisted project data. It should exist only in the in-memory editor state, specifically as part of `graphicHelper.codeBlocks`, so that saving/loading a project does not depend on or serialize this value.

Impact:
- Without a separate creation order, we cannot reliably ensure that newer modules are appended at the end of the compiler module list without coupling to Z-index.
- Visual reordering (changing Z-index) can unintentionally affect compilation order, which is undesirable once memory layout is decoupled from execution order.

## Proposed Solution

- Introduce a non-persisted "creation index" on the in-memory representation of editor code blocks:
  - Add a numeric `creationIndex` field to the data structure used in `graphicHelper.codeBlocks` that is only present in runtime/editor state.
  - Maintain a monotonically increasing counter in editor state (e.g. `nextCodeBlockCreationIndex`) that increments whenever a new code block is created; deleted blocks simply leave gaps, which is fine as long as relative ordering is stable.
- When constructing the list of modules to send to the compiler:
  - Derive the ordered list from `graphicHelper.codeBlocks`, sorted by `creationIndex` so that later additions are at the end.
  - Explicitly avoid using Z-index or any visual ordering for this compiler-facing order.
- Ensure that project serialization/deserialization does not include `creationIndex`:
  - On load, rehydrate `graphicHelper.codeBlocks` from project data and assign fresh `creationIndex` values in the order blocks are added to the helper.
  - Confirm that persistence logic ignores `creationIndex` and continues to work with existing project schemas.

## Implementation Plan

### Step 1: Define creation index field in editor state
- Locate the type/interface for code blocks used in `graphicHelper.codeBlocks` (in `@8f4e/editor-state`).
- Add an optional `creationIndex: number` field (or a wrapper type) that is only used in in-memory state, not in persisted project models.
- Introduce a `nextCodeBlockCreationIndex` counter in the relevant part of editor state, initialized to 0.

### Step 2: Assign creation index on code block creation
- Update the effect or reducer that creates/initializes new code blocks to:
  - Assign `codeBlock.creationIndex = state.nextCodeBlockCreationIndex`.
  - Increment `state.nextCodeBlockCreationIndex`.
- Confirm that reordering code blocks for visual purposes (Z-index changes, drag operations) does not modify `creationIndex`.

### Step 3: Use creation index when building compiler module list
- Identify the pipeline that converts editor code blocks into the list of modules passed to the compiler.
- Before compilation, sort the code blocks by `creationIndex` (ascending) to produce the ordered module list.
- Ensure that this sorting is applied consistently, and that Z-index is not used to derive compiler ordering.

### Step 4: Keep creation index out of persisted project data
- Review project save/load logic to ensure `creationIndex` is not serialized.
- On project load, when populating `graphicHelper.codeBlocks`, assign `creationIndex` values based on insertion order or a dedicated re-initialization routine.
- Add or update tests (if present) to confirm that project JSON does not gain new fields and that the runtime ordering is based on `creationIndex`.

## Success Criteria

- [ ] Each code block in `graphicHelper.codeBlocks` has a stable `creationIndex` that never changes during the session.
- [ ] Compiler module lists are ordered by `creationIndex`, with newly added modules appearing at the end.
- [ ] Visual reordering (Z-index changes) does not affect `creationIndex` or compiler ordering.
- [ ] Project save/load flows remain unchanged (no `creationIndex` in persisted data), and code blocks get valid `creationIndex` values on load.
- [ ] Relevant editor state tests pass, and new tests (if added) cover creation index behavior.

## Affected Components

- `packages/editor/packages/editor-state` — Code block state and effects that manage `graphicHelper.codeBlocks` and code block creation.
- `packages/editor/src` (or associated compiler integration layer) — Logic that builds the module list for the compiler from editor state.
- Project persistence layer (where projects are saved/loaded) — Needs verification to ensure `creationIndex` is not persisted.

## Risks & Considerations

- **State drift**: If `creationIndex` is not assigned consistently (e.g. some code paths create code blocks without setting it), ordering could become inconsistent.
- **Implicit dependencies**: Existing code might implicitly rely on iteration order of `graphicHelper.codeBlocks`; sorting for compilation should be explicit and localized.
- **Future persistence changes**: If project schemas evolve, we must maintain the invariant that `creationIndex` remains an in-memory concern only.

## Related Items

- `docs/brainstorming_notes/012-memory-layout-vs-execution-order.md` — Discussion of decoupling execution order from memory layout and the need for a stable creation order for modules.

## References

- Editor state code around `graphicHelper.codeBlocks` and code block creation effects.
- Compiler integration paths that transform editor code blocks into compiled modules.

## Notes

- This TODO is specifically about tracking creation order in editor state; the actual memory layout allocator and graph optimizer changes are covered by separate design/implementation work.
