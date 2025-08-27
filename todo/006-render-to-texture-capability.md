# TODO: Implement Texture Caching System

**Priority**: ��
**Estimated Effort**: 2-3 days
**Created**: 2025-08-27
**Status**: Open
**Completed**: 

## Problem Description

The current 2D engine renders all drawing operations directly to the main canvas every frame, which can be inefficient for complex, frequently-drawn elements like UI panels, complex shapes, or repeated patterns. This leads to:
- Unnecessary GPU work for static or rarely-changing content
- Performance degradation when drawing complex scenes
- Inability to optimize rendering of repeated elements
- No way to cache expensive drawing operations for reuse

## Proposed Solution

Implement a texture caching system that allows drawing operations to be cached to WebGL textures and reused. The system will include:
- `startTextureCacheBlock(cacheId, width, height, canvasX, canvasY)` - Begins caching mode and specifies where the cache area will be positioned on canvas
- `endTextureCacheBlock()` - Ends caching, creates cached texture, and automatically draws it at the position specified in startTextureCacheBlock
- `deleteCachedTexture(cacheId)` - Removes specific cached texture
- `clearTextureCache()` - Clears all cached textures
- Automatic redirection of drawing operations to a WebGL framebuffer when in cache mode
- Drawing operations inside cache blocks use normal canvas coordinates (0,0 is top-left of canvas)
- Uses WebGL framebuffers for direct texture rendering (no OffscreenCanvas needed)

## Implementation Plan

### Step 1: Add Cache-Related Properties to Engine Class
- Add private properties for texture cache management (`textureCache: Map<string, CachedTexture>`)
- Add properties for tracking cache state (`isInCacheBlock`, `currentCacheId`, `currentCacheCanvasX`, `currentCacheCanvasY`)
- Add properties for WebGL framebuffer caching (`cacheFramebuffer`, `cacheTexture`, `cacheWidth`, `cacheHeight`)
- Add properties to store original WebGL state (`originalViewport`, `originalFramebuffer`)
- Expected outcome: Engine class has all necessary properties for WebGL framebuffer caching
- Dependencies: None

### Step 2: Implement startTextureCacheBlock Method
- Create method signature with `cacheId`, `width`, `height`, `canvasX`, `canvasY` parameters
- Add validation for cache block state (ensure not already in cache mode)
- Store `canvasX` and `canvasY` for later use in `endTextureCacheBlock`
- Check if texture already exists in cache (if so, just set cache mode without creating new framebuffer)
- For new caches: create WebGL framebuffer and texture for caching
- Store original WebGL state (viewport, framebuffer) to restore later
- Bind framebuffer and set viewport for cache dimensions
- Expected outcome: Method successfully enters cache mode and sets up WebGL framebuffer rendering
- Dependencies: Step 1

### Step 3: Implement endTextureCacheBlock Method
- Add method signature with no parameters (positioning comes from startTextureCacheBlock)
- Implement logic to either reuse existing cached texture or create new one
- For new caches: the texture is already created in the framebuffer from Step 2
- Store new textures in cache Map with metadata
- **Automatically draw the cached texture at the (canvasX, canvasY) position** specified in startTextureCacheBlock
- Restore original WebGL state (framebuffer, viewport)
- Clean up cache resources
- Expected outcome: Method successfully exits cache mode, creates/uses cached texture, and draws it at specified position
- Dependencies: Steps 1-2

### Step 4: Modify Existing Drawing Methods for Cache Support
- Update `drawSpriteFromCoordinates` to check cache mode and redirect to cache framebuffer
- Update `drawLine` to check cache mode and redirect to cache framebuffer
- Update `drawSprite` to check cache mode and redirect to cache framebuffer
- Update `drawText` to check cache mode and redirect to cache framebuffer
- Add cache-specific drawing methods for each type
- Expected outcome: All drawing methods work in both normal and cache modes
- Dependencies: Steps 1-3

### Step 5: Implement Cache-Specific Drawing Methods
- Create `drawToCacheFramebuffer` for rectangles/sprites
- Create `drawLineToCacheFramebuffer` for lines
- Create `drawSpriteToCacheFramebuffer` for sprites
- Create `drawTextToCacheFramebuffer` for text
- **Important**: These methods should use normal canvas coordinates (no offset calculations needed)
- Expected outcome: Cache framebuffer receives all drawing operations with proper positioning
- Dependencies: Step 4

### Step 6: Implement Cache Buffer Management
- Create `growCacheBuffer` method for dynamic buffer sizing
- Implement `renderCacheBuffer` to flush cache buffers to framebuffer texture
- Add buffer cleanup in `cleanupCacheResources`
- Expected outcome: Cache buffers are properly managed and rendered to framebuffer
- Dependencies: Steps 1-5

### Step 7: Implement Cache Management Methods
- Create `deleteCachedTexture(cacheId)` method
- Create `clearTextureCache()` method
- Add proper WebGL texture cleanup to prevent memory leaks
- Expected outcome: Users can manage cached textures and free GPU memory
- Dependencies: Steps 1-6

### Step 8: Add Helper Methods and Utilities
- Implement automatic drawing of cached texture at specified position in `endTextureCacheBlock`
- Add `cleanupCacheResources` for proper WebGL resource management
- Add `drawCachedTextureAt` method for drawing cached textures
- Add validation and error handling throughout
- Expected outcome: Complete, robust WebGL framebuffer caching system with proper error handling
- Dependencies: Steps 1-7

### Step 9: Testing and Validation
- Test cache creation with various drawing operations
- Test cache reuse and performance improvements
- Test automatic positioning of cached textures
- Test memory management and cleanup
- Expected outcome: System works correctly and provides performance benefits
- Dependencies: Steps 1-8

## Success Criteria

- [ ] `startTextureCacheBlock` successfully enters cache mode and sets up WebGL framebuffer rendering for new caches
- [ ] `endTextureCacheBlock` successfully creates new cached textures or reuses existing ones
- [ ] **Cached textures are automatically drawn at the position specified in startTextureCacheBlock**
- [ ] All drawing methods (`drawSprite`, `drawLine`, `drawText`, etc.) work in cache mode
- [ ] Drawing operations inside cache blocks use normal canvas coordinates (0,0 is top-left of canvas)
- [ ] Cached textures can be deleted individually or all at once
- [ ] Performance improvement measurable for complex, repeated drawing operations
- [ ] No memory leaks from cached textures
- [ ] System gracefully handles errors and edge cases
- [ ] WebGL state is properly restored after cache operations

## Affected Components

- `packages/2d-engine/src/index.ts` - Main Engine class with all new caching methods
- `packages/2d-engine/src/utils/createTexture.ts` - May need updates for offscreen canvas support
- `packages/2d-engine/src/utils/buffer.ts` - Buffer utilities used by cache drawing methods

## Risks & Considerations

- **WebGL State Management**: Need to carefully manage and restore WebGL state (framebuffer, viewport) after cache operations
- **Memory Management**: Cached textures consume GPU memory and need proper cleanup
- **Performance**: WebGL framebuffer operations have overhead, so caching should only be used for complex operations
- **Browser Support**: WebGL framebuffers are well-supported across all browsers
- **Dependencies**: Requires WebGL support (standard in all modern browsers)
- **Breaking Changes**: None - this is purely additive functionality
- **Positioning Logic**: Need to ensure cached textures are drawn at exactly the position specified in startTextureCacheBlock
- **Framebuffer Binding**: Must properly handle framebuffer binding/unbinding to avoid affecting main rendering

## Related Items

- **Blocks**: None
- **Depends on**: None

## References

- [WebGL Framebuffers](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)
- [WebGL Texture Management](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html)
- [WebGL Performance Best Practices](https://webglfundamentals.org/webgl/lessons/webgl-performance.html)
- [WebGL State Management](https://webglfundamentals.org/webgl/lessons/webgl-state.html)

## Notes

- This system is inspired by modern graphics engines that cache complex rendering operations
- The positioning is built into the cache creation, making it intuitive to use
- Drawing operations inside cache blocks use normal canvas coordinates, not relative positioning
- Uses WebGL framebuffers for direct texture rendering - more efficient than OffscreenCanvas
- Consider adding cache size limits or LRU eviction for production use
- May want to add cache statistics/monitoring for debugging
- WebGL state management is critical - must properly restore framebuffer and viewport

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.