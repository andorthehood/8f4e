# TODO: Add Caching Config Option to 2D Engine Constructor

**Priority**: 🟡
**Estimated Effort**: 2-3 hours
**Created**: 2025-09-11
**Status**: Completed
**Completed**: 2025-09-11

## Problem Description

Currently, the 2D engine has two separate classes: `Engine` (no caching) and `CachedEngine` (with caching). This creates a limitation where:

- Users must choose between two different engine classes based on their caching needs
- The caching behavior is hardcoded at the class level rather than being configurable
- It's not possible to dynamically enable/disable caching at runtime
- The API surface is split between two classes, making it harder to maintain and use
- Projects that want optional caching must implement their own switching logic

This reduces flexibility and makes the engine API more complex than necessary.

## Proposed Solution

Add a configuration option to the base `Engine` constructor to enable/disable caching:

- Add an optional `caching` parameter to the `Engine` constructor
- When `caching: true`, internally use `CachedRenderer` instead of `Renderer`
- When `caching: false` or undefined, use the standard `Renderer`
- Maintain backward compatibility by defaulting to no caching
- Eventually deprecate the separate `CachedEngine` class in favor of the unified approach

## Implementation Plan

### Step 1: Update Engine Constructor Interface
- Add optional `caching` parameter to `Engine` constructor:
  ```typescript
  constructor(canvas: HTMLCanvasElement, options?: { caching?: boolean; maxCacheItems?: number })
  ```
- Create type definitions for engine options
- Expected outcome: Unified constructor interface supporting both cached and non-cached modes

### Step 2: Implement Conditional Renderer Selection
- Modify `Engine` constructor to conditionally create `CachedRenderer` or `Renderer` based on options
- Add caching-related methods to `Engine` class when caching is enabled
- Ensure proper initialization of cache-related properties
- Expected outcome: Single engine class that can operate in both modes

### Step 3: Add Caching Method Delegation
- Add caching methods (`cacheGroup`, `drawCachedContent`, etc.) to `Engine` class
- Delegate to the underlying renderer when caching is enabled
- Add runtime checks to ensure methods are only called when caching is enabled
- Expected outcome: Unified API surface regardless of caching mode

### Step 4: Update Documentation and Examples
- Update README and examples to show the new unified approach
- Add migration guide for users of `CachedEngine`
- Update type definitions and JSDoc comments
- Expected outcome: Clear documentation for the new unified API

## Success Criteria

- [ ] `Engine` constructor accepts optional caching configuration
- [ ] Single engine class supports both cached and non-cached modes
- [ ] All existing `CachedEngine` functionality is available through the unified API
- [ ] Backward compatibility is maintained for existing `Engine` usage
- [ ] Documentation and examples are updated to reflect the new approach
- [ ] No breaking changes to existing functionality
- [ ] Performance characteristics remain the same for both modes

## Affected Components

- `packages/2d-engine/src/engine.ts` - Add caching option to constructor and conditional renderer selection
- `packages/2d-engine/src/CachedEngine.ts` - Mark as deprecated, delegate to unified Engine
- `packages/2d-engine/src/types.ts` - Add engine options type definitions
- `packages/2d-engine/README.md` - Update documentation with new unified API
- `packages/2d-engine/examples/` - Update examples to use unified approach
- `packages/editor/src/view/index.ts` - Update to use new unified Engine API

## Risks & Considerations

- **Breaking Changes**: Need to ensure existing code using `Engine` continues to work
- **API Surface**: Adding methods to `Engine` that only work when caching is enabled might be confusing
- **Performance**: Ensure no performance overhead when caching is disabled
- **Dependencies**: Need to handle the transition period where both approaches coexist
- **Type Safety**: Ensure TypeScript properly handles the conditional API surface

## Related Items

- **Depends on**: None
- **Enables**: Future engine optimizations and unified API improvements
- **Related**: Any future engine configuration options

## References

- Current Engine constructor: `packages/2d-engine/src/engine.ts` (lines 20-30)
- Current CachedEngine constructor: `packages/2d-engine/src/CachedEngine.ts` (lines 12-18)
- Engine usage in editor: `packages/editor/src/view/index.ts` (line 27)

## Notes

- The current `CachedEngine` extends `Engine` and replaces the renderer, so the pattern is already established
- Consider adding a deprecation warning to `CachedEngine` constructor to guide users to the new approach
- The `maxCacheItems` parameter should also be configurable through the options object
- Runtime checks for caching methods should provide clear error messages when caching is disabled

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
