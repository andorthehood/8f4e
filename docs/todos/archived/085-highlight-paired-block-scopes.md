---
title: 'TODO: Highlight paired block scopes with backdrop rectangles'
priority: Medium
effort: 2-3d
created: 2025-11-05
status: Closed
completed: null
---

# TODO: Highlight paired block scopes with backdrop rectangles

## Problem Description

Control-flow constructs that use paired blocks (e.g., `if`/`ifEnd`, `loop`/`loopEnd`, `switch`/`switchEnd`) are visually indistinguishable from surrounding blocks in the editor. Users must scan connector wiring or read block titles to identify the start and end of a scope, which becomes error-prone in dense projects. The flat presentation also makes it difficult to spot unbalanced structures or nested scopes at a glance. Without visual grouping cues, onboarding and debugging take longer and mistakes slip through when moving or deleting blocks.

## Proposed Solution

Render a soft-colored rectangle behind any contiguous set of blocks that share a start/end pairing to communicate scope boundaries. Each pairing would choose a distinctive fill derived from the active theme (or per-block variant) so nested scopes remain legible, with shades shifting based on nesting depth (e.g., inner scopes slightly lighter or darker than their parent). The renderer should auto-expand the rectangle to include all blocks between the start and end nodes, even when they span multiple rows. Interaction affordances (dragging, selection) must still operate on individual blocks while the backdrop provides context.

## Implementation Plan

### Step 1: Identify paired-block regions
- Extend editor state or helper utilities to map block graph metadata into ordered start/end pairs
- Handle nested and overlapping scopes by stacking region descriptors with z-order rules
- Expose the derived regions to rendering layers without mutating core block data

### Step 2: Generate drawing geometry
- Calculate bounding boxes that cover all blocks between each start/end pair, including padding for readability
- Convert the geometry into drawer-friendly data structures (e.g., rectangles with color ids and z-index)
- Integrate with undo/redo so region visuals update instantly when blocks are added, moved, or removed

### Step 3: Render themed scope backdrops
- Update the web UI drawers to render filled rectangles behind blocks before drawing the block sprites
- Pull fill and border colors from theme definitions, coordinating with per-block variant palettes (TODO-084) and adjusting shades based on nesting depth
- Ensure hit-testing and selection overlays remain on top, and include screenshot/visual regression coverage

## Success Criteria

- [ ] Editor visually groups paired start/end blocks with theme-aware backdrop rectangles
- [ ] Nested scopes remain distinguishable and do not obscure block controls or connectors
- [ ] Backdrop colors vary by nesting depth to clarify hierarchy
- [ ] Moving or editing blocks updates scope backdrops in real time without artifacts
- [ ] Visual regression and screenshot suites cover representative scope combinations

## Affected Components

- `packages/editor/packages/editor-state` - derive scope metadata and expose region descriptors
- `packages/editor/packages/web-ui/src/drawers` - render backdrop rectangles within the drawing pipeline
- `packages/editor/packages/web-ui` UI components - update selection/hover logic to coexist with backdrops
- `packages/editor/packages/sprite-generator` - ensure theme palettes include colors for scope highlights

## Risks & Considerations

- **Overlap handling**: Deeply nested scopes may introduce rendering artifacts; establish z-order and blending rules early
- **Performance**: Calculating large region geometry on each update could impact frame rate; memoize computations where possible
- **Theme compatibility**: Backdrop colors must meet accessibility contrast targets across all themes/variants
- **State migration**: Ensure projects saved without scope metadata still render correctly after update

## Related Items

- **Related**: TODO-074 (code block render loop consolidation) for integrating additional draw passes
- **Related**: TODO-084 (per-code-block theme variants) to source colors for scope overlays

## References

- UX feedback notes from October 2025 user study about scope visibility
- Early mockups of scope highlighting from design sync (link to be added)

## Notes

- Consider optional user preference toggle for scope backdrops if performance on low-powered devices becomes an issue
- Document the scope pairing detection logic for plugin/theme authors

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
