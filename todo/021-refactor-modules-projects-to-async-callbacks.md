# TODO: Refactor Modules and Projects to Use Async Callback Functions

**Priority**: 🟡  
**Estimated Effort**: 2-3 days  
**Created**: 2024-12-19  
**Status**: Open  

## Problem Description

Currently, the editor receives modules and projects as static objects during instantiation:

```typescript
const editor = await initEditor(canvas, project, {
  // ... other options
  projects,  // Static object with all projects
  modules,   // Static object with all modules
  requestRuntime,
});
```

This approach has several limitations:
- **Memory overhead**: All modules and projects are loaded upfront, even if never used
- **Bundle size**: Increases initial bundle size with potentially unused code
- **Scalability**: As the number of modules/projects grows, the initial load becomes heavier
- **Dynamic loading**: No way to load modules/projects on-demand or from external sources
- **Lazy loading**: Cannot implement lazy loading strategies for better performance
- **External sources**: Difficult to integrate with external module/project repositories

## Proposed Solution

Replace the static `projects` and `modules` objects with async callback functions:

- **`getListOfModules()`** - Returns list of available modules with metadata (slug, title, category)
- **`getModule(slug)`** - Returns complete module data including code for a specific module
- **`getListOfProjects()`** - Returns list of available projects with metadata (slug, title, description)
- **`getProject(slug)`** - Returns complete project data for a specific project

This approach enables:
- **Lazy loading**: Only load modules/projects when needed
- **Dynamic discovery**: Load module/project lists on-demand
- **External sources**: Easy integration with external repositories
- **Better performance**: Reduce initial bundle size and memory usage
- **Flexibility**: Consumers can implement custom loading strategies

## Implementation Plan

### Step 1: Update Editor Interface
- Modify `Options` interface in `packages/editor/src/state/types.ts`
- Replace `projects: Record<string, Project>` with `getListOfProjects: () => Promise<Array<{slug: string, title: string, description: string}>>`
- Replace `modules: Record<string, ExampleModule>` with `getListOfModules: () => Promise<Array<{slug: string, title: string, category: string}>>`
- Add `getProject: (slug: string) => Promise<Project>` and `getModule: (slug: string) => Promise<ExampleModule>`

### Step 2: Update Editor Implementation
- Modify `packages/editor/src/state/effects/menu/menus.ts` to use async callbacks
- Update `moduleCategoriesMenu` and `builtInModuleMenu` to handle async module loading
- Update `projectMenu` to handle async project loading
- Ensure proper error handling for failed async operations

### Step 3: Update Consumer Implementation
- Modify `src/editor.ts` to implement the new callback functions
- Implement `getListOfModules()` that returns metadata from existing modules
- Implement `getModule(slug)` that returns full module data
- Implement `getListOfProjects()` that returns metadata from existing projects
- Implement `getProject(slug)` that returns full project data
- Update editor instantiation to use new callback pattern

### Step 4: Update Type Definitions
- Ensure all TypeScript types are properly updated
- Update any interfaces that reference the old structure
- Add proper error handling types for async operations

### Step 5: Testing and Validation
- Test that all existing functionality still works
- Verify lazy loading behavior
- Test error handling for missing modules/projects
- Ensure backward compatibility where possible

## Success Criteria

- [ ] Editor accepts async callback functions instead of static objects
- [ ] All existing functionality preserved (module browsing, project loading, etc.)
- [ ] Lazy loading implemented for modules and projects
- [ ] Error handling for failed async operations
- [ ] No breaking changes to existing editor API consumers
- [ ] All tests pass with new async implementation
- [ ] Performance improvements measurable (reduced initial bundle size)

## Affected Components

- `packages/editor/src/state/types.ts` - Update Options interface
- `packages/editor/src/state/effects/menu/menus.ts` - Update menu generation logic
- `src/editor.ts` - Implement new callback functions
- `src/examples/modules/index.ts` - May need restructuring for lazy loading
- `src/examples/projects/index.ts` - May need restructuring for lazy loading

## Risks & Considerations

- **Breaking Changes**: This is a significant interface change that could break existing consumers
- **Async Complexity**: Adding async operations increases complexity and potential for race conditions
- **Error Handling**: Need robust error handling for network failures, missing modules, etc.
- **Performance**: Need to ensure async operations don't introduce performance regressions
- **Caching**: Consider implementing caching strategies to avoid repeated async calls
- **Backward Compatibility**: May need to provide migration path for existing consumers

## Dependencies

- **Depends on**: No other TODOs currently blocking this
- **Blocks**: Could enable future TODOs around external module repositories or dynamic loading

## Related Items

- **Related**: Similar to the runtime callback pattern already implemented in `requestRuntime`
- **Pattern**: Follows the same async callback pattern used for runtime management

## References

- Current implementation in `src/editor.ts` lines 45-46
- Current Options interface in `packages/editor/src/state/types.ts` lines 322-328
- Menu generation logic in `packages/editor/src/state/effects/menu/menus.ts`

## Notes

- This refactor follows the same pattern already established with `requestRuntime`
- Consider implementing a simple in-memory cache to avoid repeated async calls for the same data
- May want to add loading states/indicators in the UI during async operations
- Consider adding retry logic for failed async operations

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 