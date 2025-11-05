---
title: 'TODO: Add per-code-block theme variants'
priority: Medium
effort: 2-3d
created: 2025-11-05
status: Open
completed: null
---

# TODO: Add per-code-block theme variants

## Problem Description

The editor currently applies a single color palette per global theme across every code block. Users cannot differentiate individual blocks within a patch without manually adjusting assets, which makes complex graphs hard to scan and reduces accessibility when multiple collaborators expect familiar color hints. Because `ColorScheme` only supports one set of block colors, introducing additional themes requires duplicating the whole scheme (e.g., `default-blue`, `default-green`) which explodes the number of top-level themes and breaks existing storage.

## Proposed Solution

Extend the theme system so every main color scheme bundles three code-block variants (e.g., primary, accent, neutral) that can be assigned per block. Update the editor UI to expose a picker scoped to the selected block, persist the choice in editor state, and adjust renderers to map the variant back into `ColorScheme` definitions. Provide sensible defaults so existing projects keep their current look without migration friction.

## Implementation Plan

### Step 1: Expand color scheme models
- Add a `codeBlockThemes` collection (three named entries) to `ColorScheme` in `@8f4e/sprite-generator`
- Update loader callbacks and static definitions to provide the new structure under each main theme
- Ensure serialization/deserialization of editor settings continues to succeed

### Step 2: Track per-block theme preference
- Extend editor state to store a theme variant id on each code block record
- Surface the variant in menus/context panels so users can switch between the three options
- Persist the selection through project save/load and history operations

### Step 3: Render code blocks with the selected variant
- Update web-ui drawers to read the per-block variant and pull colors from the matching scheme entry
- Adjust sprite/sprite-sheet generation to preload the variant palettes
- Verify screenshot tests and visual regression harnesses cover the new combinations

## Success Criteria

- [ ] Color scheme definitions include three distinct code block variants without duplicating base themes
- [ ] Users can assign different variants to individual code blocks via the editor interface
- [ ] Rendered blocks, connectors, and sprites reflect the chosen variant in live preview and exports
- [ ] Existing projects retain their appearance when the feature ships

## Affected Components

- `packages/editor/packages/sprite-generator/src/types.ts` - extend `ColorScheme` typing and sprite generation inputs
- `packages/editor/packages/editor-state` - persist per-code-block variant selection and migrate stored settings
- `packages/editor/packages/web-ui` - update menus and drawers to surface and apply variant colors
- `packages/editor/src/index.ts` - verify state wiring and subscriptions propagate variant changes to UI

## Risks & Considerations

- **State migration**: Saving variant identifiers must not break older project files; provide fallback mapping when absent
- **Rendering performance**: Additional palettes may increase GPU texture or shader bindings; profile to avoid regressions
- **UX complexity**: Present variant choices clearly so users understand variants belong to the active global theme
- **Dependencies**: Coordinate with roadmap items that reorganize color scheme loading or lazy-loading behavior

## Related Items

- **Depends on**: Upcoming refactor to lazy-load color schemes (TODO-060) so variant data is available during block editing
- **Related**: TODO-074 (code block render loop consolidation), because variant handling should align with the unified drawer

## References

- Internal design discussions on color customization (4 Nov 2025 meeting notes)
- Web UI style guide draft for theme variants
- [Figma prototype – block variant picker](https://example.com) *(placeholder link for design team asset)*

## Notes

- Start with three variants per theme (`primary`, `accent`, `contrast`) to balance flexibility with complexity
- Consider exposing variant definitions through docs for third-party theme authors
- Coordinate QA with accessibility review to validate color contrast compliance

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
