# TODO: Rename exampleProjects and exampleModules to projects and modules

**Priority**: 🟡  
**Estimated Effort**: 2-3 hours  
**Created**: 2025-08-26
**Status**: Completed  
**Completed**: 2025-08-26

## Problem Description

The codebase currently uses inconsistent naming conventions for examples:
- Some references use "exampleProjects" and "exampleModules"
- The actual folder structure already uses "projects" and "modules" under `src/examples/`
- This inconsistency creates confusion in both code and UI
- The naming should be simplified to just "projects" and "modules" for clarity

## Proposed Solution

Standardize the naming throughout the codebase and UI:
- Rename all references from "exampleProjects" to "projects"
- Rename all references from "exampleModules" to "modules"
- Update UI text and labels accordingly
- Ensure consistency between folder structure and code references

## Implementation Plan

### Step 1: Audit Current Usage
- Search codebase for "exampleProjects" and "exampleModules" references
- Identify all files and components that need updates
- Document current usage patterns

### Step 2: Update Code References
- Rename variables, function names, and import statements
- Update TypeScript interfaces and types
- Ensure all references are consistently updated

### Step 3: Update UI Components
- Update any UI text, labels, or display names
- Update navigation and menu items
- Ensure user-facing text is consistent

### Step 4: Update Documentation
- Update any documentation that references the old naming
- Update README files and inline comments
- Ensure examples and documentation are aligned

## Success Criteria

- [ ] No references to "exampleProjects" or "exampleModules" remain in code
- [ ] All UI elements consistently use "projects" and "modules"
- [ ] Folder structure naming matches code references
- [ ] No breaking changes introduced
- [ ] All tests pass after renaming

## Affected Components

- `src/examples/` - Main examples directory structure
- `src/examples/projects/` - Projects subdirectory
- `src/examples/modules/` - Modules subdirectory
- Any components that reference or display these directories
- Documentation files that mention the old naming

## Risks & Considerations

- **Risk 1**: Breaking existing imports or references - Mitigation: Comprehensive search and replace
- **Risk 2**: UI text changes affecting user experience - Mitigation: Ensure all UI elements are updated consistently
- **Dependencies**: None identified
- **Breaking Changes**: Should be minimal if done as a comprehensive rename

## Related Items

- **Blocks**: None identified
- **Depends on**: None identified
- **Related**: May be related to other UI consistency improvements

## References

- Current folder structure: `src/examples/projects/` and `src/examples/modules/`
- Template structure already follows the desired naming convention

## Notes

- The folder structure already uses the desired naming ("projects" and "modules")
- This is primarily a code and UI consistency improvement
- Should be done as a single comprehensive change to avoid confusion

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 