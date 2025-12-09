---
title: 'TODO: Add Function Code Blocks to Editor'
priority: Medium
effort: 3-4d
created: 2025-12-09
status: Open
completed: null
---

# TODO: Add Function Code Blocks to Editor

## Problem Description

- The compiler now supports `function`/`functionEnd` blocks (see 121) but the editor UI/state still exposes only module and config blocks.
- Users cannot author helper functions or call them from modules inside the editor, so all helper code must stay duplicated per module despite compiler support.
- Missing serialization/runtime wiring means even if a user hand-writes function syntax the editor drops it, resulting in compiler payloads that omit functions entirely.

## Proposed Solution

- Extend editor-state’s code block typing, creation, serialization, and compiler bridge so `function` blocks are classified, stored, and sent to the compiler just like modules/config.
- Update UI/UX (context menu options, inspectors, labels, docs/examples) so users can intentionally create and manage function blocks, including naming and ordering.
- Ensure worker plumbing and callbacks pass the new `functions` array through to `@8f4e/compiler`, and document the workflow in docs/examples so feature users know how to use it.

## Implementation Plan

### Step 1: Update editor-state data model
- Expand `CodeBlockType` union, block type detection, block ID helpers, serialization/deserialization, and creation logic to understand `function` markers and keep IDs unique.
- Expected outcome: loading/saving projects preserves function blocks and they show up beside modules/config.
- Dependencies: none.

### Step 2: Wire compiler payloads and worker plumbing
- Change `flattenProjectForCompiler` into a helper returning `{ modules, functions }`, update effect to pass both arrays, and thread the new argument through compiler worker + callback.
- Expected outcome: editor sends both modules and functions so compiler compiles helpers before modules.
- Dependencies: Step 1 (need accurate typing/collection).

### Step 3: Update UI/UX and docs/tests
- Add “New Function” menu entry, ensure inspector/canvas labeling works for function blocks, add examples/docs explaining usage, and expand unit/screenshot tests covering new flow.
- Expected outcome: users can create/edit functions, docs highlight workflow, automated coverage protects regression.
- Dependencies: Steps 1-2 for data availability.

## Success Criteria

- [ ] Editor context menu offers a “New Function” option that creates a correctly typed `function` block.
- [ ] Serialized projects retain function blocks (round-trip tests pass) and compiler payloads include a `functions` array.
- [ ] Updated docs/examples/tests demonstrate module ↔ function interaction and pass CI.

## Affected Components

- `packages/editor/packages/editor-state` – block type detection, creation, serialization, compiler effect.
- `packages/editor/packages/web-ui` – menu labels, block rendering/selection UX.
- `packages/editor/src` + `packages/compiler-worker` – compiler callback/worker payloads.
- `docs/` + `src/examples/` – user-facing instructions and samples.

## Risks & Considerations

- **Regression risk**: Changing block creation/import/export touches persistence; add regression tests to avoid corrupting existing projects.
- **UX confusion**: Need clear naming/organization so users can distinguish modules/config/functions visually.
- **Dependency**: Relies on TODO 121 completion (compiler already supports functions); verify API contract before merging.
- **Breaking changes**: None expected if serialization remains backward compatible.

## Related Items

- **Depends on**: `docs/todos/archived/121-compiler-pure-functions.md`
- **Related**: `docs/todos/084-per-code-block-theme-variants.md` (future per-block styling might need updates for function type)

## References

- `docs/todos/archived/121-compiler-pure-functions.md`
- `docs/brainstorming_notes/016-compiler-pure-functions.md`

## Notes

- Coordinate with UX for iconography/highlights once block type exists.
- Consider following up with linting (e.g., unused function detection) after base support lands.

