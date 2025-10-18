# TODO: Fix Color Theme Cache Clearing Bug

**Priority**: 🟡
**Estimated Effort**: 2-3 hours
**Status**: Completed
**Created**: 2025-10-17
**Completed** 2025-10-17

## Problem Description

When users change the color theme in the editor, cached content is not cleared, causing some UI elements to retain their old colors. This happens because:

- The editor uses glugglug's caching system to cache code blocks for performance
- Code blocks are cached with IDs like `codeBlock${codeBlock.id}${codeBlock.lastUpdated}`
- When color schemes change, the cached textures still contain the old color information
- The `setColorScheme` event handler only updates the state but doesn't clear the cache
- This results in visual inconsistencies where some elements show the new theme while others show the old theme

## Proposed Solution

Clear all cached content when the color scheme changes by calling `engine.clearAllCache()` in the color theme effect handler. This ensures that all cached textures are regenerated with the new color scheme.

**Key changes required:**
1. Access the engine instance in the color theme effect
2. Call `clearAllCache()` when color scheme changes
3. Ensure the engine is available when the effect runs

## Implementation Plan

### Step 1: Modify color theme effect to access engine
- Update the color theme effect to receive engine instance
- Add engine parameter to the effect function signature
- Update the effect registration in the main state initialization

### Step 2: Add cache clearing on color scheme change
- Call `engine.clearAllCache()` in the `onSetColorScheme` handler
- Ensure this happens after the color scheme state is updated
- Add error handling in case engine is not available

### Step 3: Update engine access pattern
- Modify the view initialization to pass engine to state effects
- Ensure engine is available when color theme changes occur
- Consider if other effects might also need engine access

## Success Criteria

- [ ] Color scheme changes immediately update all UI elements
- [ ] No visual artifacts or mixed color themes after switching
- [ ] Cached content is properly regenerated with new colors
- [ ] Performance impact is minimal (cache clearing is fast)
- [ ] All existing functionality continues to work

## Affected Components

- `packages/editor/src/state/effects/colorTheme.ts` - Add cache clearing logic
- `packages/editor/src/state/index.ts` - Pass engine to effects
- `packages/editor/src/view/index.ts` - Make engine available to state
- `packages/editor/src/view/drawers/codeBlocks/index.ts` - Cached code blocks will be regenerated

## Risks & Considerations

- **Performance Impact**: Clearing all cache on every color change might impact performance temporarily
- **Engine Availability**: Need to ensure engine is available when color theme effect runs
- **State Dependencies**: Color theme effect runs early in initialization, engine might not be ready
- **Alternative Approach**: Could clear specific cache entries instead of all cache, but this is more complex

## Related Items

- **Related**: Color scheme system in `src/color-schemes.ts`
- **Related**: Glugglug caching system documentation
- **Depends on**: Engine initialization and state management

## References

- [Glugglug caching documentation](packages/editor/packages/glugglug/README.md#caching)
- [Cache clearing API](packages/editor/packages/glugglug/src/engine.ts#clearAllCache)
- [Color theme effect](packages/editor/src/state/effects/colorTheme.ts)

## Notes

- The cache ID includes `codeBlock.lastUpdated` which should theoretically invalidate when content changes, but color scheme changes don't update this timestamp
- Could consider adding color scheme version to cache IDs as an alternative approach
- Current implementation caches code blocks in `packages/editor/src/view/drawers/codeBlocks/index.ts` line 41

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
