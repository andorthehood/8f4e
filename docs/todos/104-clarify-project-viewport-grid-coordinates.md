---
title: 'TODO: Clarify Project Viewport Grid Coordinates'
priority: Medium
effort: 2–4 hours
created: 2025-11-27
status: Completed
completed: 2025-11-27
---

# TODO: Clarify Project Viewport Grid Coordinates

## Problem Description

The `Project` type currently uses a generic `viewport` field to store the editor’s initial camera position.  
However, this field actually represents **grid coordinates** (logical cell positions), while the runtime uses **pixel-based** viewport values (`graphicHelper.viewport.x/y`).

This naming mismatch makes it easy to:
- Confuse grid coordinates with pixel coordinates when importing/exporting projects.
- Introduce subtle bugs when external tools or manual edits treat `viewport` as pixels.
- Misinterpret negative values (e.g., off-origin viewports) as invalid or problematic.

## Proposed Solution

Make the grid-based nature of project coordinates explicit in the schema while keeping runtime viewport pixels unchanged:
- Change the project-level `viewport` shape to:
  - `viewport: { gridCoordinates: { x: number; y: number } }`
- Change project code blocks from top-level `x`/`y` fields to:
  - `codeBlocks[i].gridCoordinates: { x: number; y: number }`
- Keep `graphicHelper.viewport` as-is (pixel coordinates) at runtime and continue converting grid ↔ pixels on import/export.

Alternative approaches considered:
- Only renaming the field (e.g. `viewportGridCoordinates`) without nesting (rejected: less expressive once code blocks also gain grid coordinates).
- Switching to storing pixels in the project file (rejected: breaks existing examples and makes JSON less portable across fonts/grid sizes).

## Implementation Plan

### Step 1: Update Types and Naming
- Update the `Project`/`Viewport` types so `viewport` contains `gridCoordinates: { x; y }` instead of direct `x`/`y`.
- Update `CodeBlock`/project code block types to replace top-level `x`/`y` with `gridCoordinates: { x; y }`.
- Ensure all TypeScript references in `@8f4e/editor-state` compile with the new structure.
- Expected outcome: the type system enforces explicit grid coordinates for both viewport and code blocks.

### Step 2: Adjust Import/Export Logic
- Update `projectImport` to:
  - Read `viewport.gridCoordinates` and convert grid → pixels using `vGrid`/`hGrid`.
  - Read `codeBlock.gridCoordinates` and convert to pixel `x`/`y` and `gridX`/`gridY` in `graphicHelper.codeBlocks`.
- Update `projectSerializer` to:
  - Write `viewport.gridCoordinates` from pixel viewport divided by `vGrid`/`hGrid`.
  - Write `codeBlock.gridCoordinates` from `gridX`/`gridY` (or pixel positions divided by grid size).
- Expected outcome: project JSON consistently uses nested grid coordinates for both viewport and code blocks.

### Step 3: Migrate Example Projects and Docs
- Update all example projects and any bundled JSON to use `viewport.gridCoordinates` and `codeBlock.gridCoordinates` instead of top-level `x`/`y`.
- Verify projects with negative grid coordinates still load and render as expected.
- Add a short note in docs (examples format + storage callbacks) explaining the grid vs. pixel distinction.
- Expected outcome: consistent naming across examples, docs, and runtime behavior.

## Success Criteria

- [ ] `Project.viewport` uses a nested `gridCoordinates` object instead of top-level `x`/`y`.
- [ ] Project `codeBlocks` use `gridCoordinates` instead of top-level `x`/`y`.
- [ ] Import/export correctly round-trip viewport and code block grid coordinates without regressions.
- [ ] All example projects with negative grid coordinates render correctly (no black screen / blank canvas).
- [ ] Documentation clearly describes the relationship between project grid coordinates and runtime pixel coordinates for both viewport and code blocks.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` – `Project` and `Viewport`-related types.
- `packages/editor/packages/editor-state/src/effects/projectImport.ts` – project load path, grid → pixel conversion.
- `packages/editor/packages/editor-state/src/helpers/projectSerializer.ts` – project export path, pixel → grid conversion.
- `src/examples/projects/*.ts` – example projects that define `viewport` and code block positions.
- `src/storage-callbacks.ts` – any references to project `viewport`/code block positions in saved/restored JSON.

## Risks & Considerations

- **Risk 1**: Breaking existing stored projects in localStorage or user files that still use `viewport`.
- **Risk 2**: Confusion between runtime viewport fields and project-level fields during renaming.
  - Mitigation: Keep runtime `graphicHelper.viewport` unchanged and explicitly document the separation.
- **Dependencies**: None strict, but easier to complete before large changes to import/export or project format.
- **Breaking Changes**: Intentional; older JSON files that still use `viewport` do not need fallback support and may be considered legacy/incompatible.

## Related Items

- **Related**: Bug investigation around negative viewports causing black render (current debugging context).
- **Related**: Any future TODOs about project format versioning or migration tooling.

## References

- `docs/todos/_template.md` – TODO formatting and lifecycle.
- `docs/usage.md` – High-level editor usage (for where to mention viewport semantics).
- Example projects in `src/examples/projects/` that already use negative viewport grid positions.

## Notes

- This change is primarily about clarity and preventing future bugs rather than adding new behavior.
- The application is not public yet, so we can safely introduce this as a breaking change without migration tooling.
- No fallback/backward-compat support is required for older project file versions that still use `viewport`; they can be treated as a previous format version.
