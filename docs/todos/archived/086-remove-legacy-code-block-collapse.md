---
title: 'TODO: Remove legacy code block collapse remnants'
priority: Medium
effort: 1-2d
created: 2025-11-05
status: Completed
completed: 2025-11-05
---

# TODO: Remove legacy code block collapse remnants

## Problem Description

The editor previously supported collapsing code blocks, but the feature was removed. Several fields and behaviors tied to that system (`isOpen`, collapse toggles, conditional rendering branches) still linger throughout editor state, UI drawers, and test fixtures. These vestigial flags add mental overhead, complicate TypeScript types, and risk introducing regressions whenever refactors forget to maintain unused states. They also mislead contributors into thinking collapse functionality still exists.

## Proposed Solution

Audit packages for collapse-related code and strip everything that no longer influences the current experience. Replace `isOpen` and similar flags with fixed values or remove them entirely, ensuring derived data structures (render caches, sprite lookups) no longer branch on collapse state. Update tests, mocks, and documentation to reflect that blocks are always expanded.

## Implementation Plan

### Step 1: Inventory collapse artifacts
- Search editor-state, web-ui drawers, and fixtures for `isOpen`, collapse toggles, or related helpers (e.g., `codeBlockOpener`)
- Document where state serialization/deserialization still expects collapse metadata
- Verify no runtime callbacks depend on the old behavior

### Step 2: Remove unused state and logic
- Update TypeScript interfaces in `@8f4e/editor-state` to drop collapse fields, providing migrations if stored projects still include them
- Delete helper functions and effects that mutated collapse state, simplifying loader code and runtime caches
- Adjust renderer logic so code block drawing paths no longer branch on collapse flags

### Step 3: Clean up fixtures and tests
- Refresh mocks and screenshot fixtures to remove stale `isOpen` values
- Update unit tests to align with the always-expanded assumption
- Run lint/typecheck/test suites to confirm no references remain

## Success Criteria

- [ ] No TypeScript interfaces or runtime state contain collapse-related flags
- [ ] Renderer and effects code perform identically without `isOpen` checks
- [ ] Tests, fixtures, and docs reflect the always-expanded behavior
- [ ] Stored projects with legacy data load without errors (ignoring obsolete fields)

## Affected Components

- `packages/editor/packages/editor-state` - state types, loaders, and effects manipulating collapse state
- `packages/editor/packages/web-ui/src/drawers` - renderers currently branching on `isOpen`
- `packages/editor/packages/web-ui/screenshot-tests` - update mocks and fixtures
- `packages/editor/src/index.ts` - ensure store subscriptions no longer expect collapse-related updates

## Risks & Considerations

- **Migration**: Projects saved before removal may still contain collapse metadata; stripping it must be backward compatible
- **Visual regressions**: Removing code paths could subtly change block sizing or cursor rendering; perform manual verification
- **Documentation drift**: Audit docs to ensure no references to collapsible blocks remain

## Related Items

- **Related**: TODO-074 (render loop consolidation) since simplifying state helps streamline drawing
- **Related**: TODO-085 (scope highlighting) which depends on accurate block metadata post-cleanup

## References

- Historical collapse toggle implementation (`codeBlockOpener` effect)
- Editor state change logs from the collapse removal rollout

## Notes

- Consider adding a lint rule or type test to prevent reintroduction of collapse-only fields
- Coordinate with QA to confirm no automated scripts rely on the old collapse API

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
