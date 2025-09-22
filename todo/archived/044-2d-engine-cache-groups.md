# 044 - 2D Engine Cache Groups Implementation

**Priority**: 🟡
**Estimated Effort**: 1-2 days
**Created**: 2025-01-19
**Status**: Cancelled
**Completed**: 2025-01-20
## Problem Description

The current 2D engine redraws complex UI elements and sprites every frame, even when they haven't changed. This creates performance bottlenecks for:
- Complex UI panels with multiple sprites and text
- Frequently used game objects that remain static
- Expensive drawing operations that could be cached and reused

**Current State**: Every drawing operation executes each frame regardless of content changes
**Impact**: Unnecessary GPU/CPU usage, potential frame rate drops, especially on mobile devices
**Why it's a Problem**: Performance degradation as scene complexity increases

## Proposed Solution

**High-level Approach**:
Cache drawing operations to offscreen WebGL textures and reuse them across frames.

**Key Changes Required**:
- Add cache storage using WebGL framebuffers and textures
- Implement LRU eviction system with configurable limits
- Modify all drawing methods to respect cache state
- Add manual cache management methods

**Alternative Approaches Considered**:
- Canvas2D approach: Rejected due to WebGL performance requirements
- Nested cache groups: Rejected for simplicity and predictability
- Automatic invalidation: Deferred to keep initial implementation simple

**Core Features**:
- Cache drawing operations between `startCacheGroup(cacheId, width, height)` and `endCacheGroup()` calls
- Store cached content as offscreen textures indexed by `cacheId`
- On first call: render operations to offscreen texture, then draw to main canvas
- On subsequent calls: skip rendering operations and directly draw cached texture
- **No nesting allowed**: Cache groups cannot be stacked inside each other

## Implementation Plan

### Phase 1: Core Properties
Add to Engine class constructor:
```typescript
cacheMap: Map<string, WebGLTexture>
cacheFramebuffers: Map<string, WebGLFramebuffer>  
cacheSizes: Map<string, {width: number, height: number}>
cacheAccessOrder: string[] // For LRU tracking
savedOffsetX: number | null
savedOffsetY: number | null
currentCacheId: string | null
isInCacheGroup: boolean
maxCacheItems: number = 50 // Configurable limit
```

### Phase 2: Framebuffer Utilities
Create utility functions:
- `createCacheFramebuffer(width: number, height: number): {framebuffer: WebGLFramebuffer, texture: WebGLTexture}`
- `switchRenderTarget(framebuffer: WebGLFramebuffer | null)`
- `drawCachedTexture(texture: WebGLTexture, width: number, height: number)`

### Phase 3: Core Methods

#### startCacheGroup(cacheId: string, width: number, height: number)
```typescript
startCacheGroup(cacheId: string, width: number, height: number): void {
    // Guard against nesting
    if (this.isInCacheGroup) {
        throw new Error('Cannot nest cache groups');
    }
    
    this.isInCacheGroup = true;
    this.currentCacheId = cacheId;
    
    // Check if cache exists
    if (this.cacheMap.has(cacheId)) {
        // Cache exists - update access order and skip drawing operations
        this.updateCacheAccess(cacheId);
        return;
    }
    
    // Check cache limit and evict if necessary
    this.enforceMaxCacheLimit();
    
    // Create new cache
    const {framebuffer, texture} = this.createCacheFramebuffer(width, height);
    this.cacheFramebuffers.set(cacheId, framebuffer);
    this.cacheMap.set(cacheId, texture);
    this.cacheSizes.set(cacheId, {width, height});
    this.cacheAccessOrder.push(cacheId);
    
    // Save current offsets and reset to (0,0)
    this.savedOffsetX = this.offsetX;
    this.savedOffsetY = this.offsetY;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Switch to framebuffer rendering
    this.switchRenderTarget(framebuffer);
}
```

#### endCacheGroup()
```typescript
endCacheGroup(): void {
    if (!this.isInCacheGroup) {
        throw new Error('No cache group to end');
    }
    
    const cacheId = this.currentCacheId!;
    const texture = this.cacheMap.get(cacheId)!;
    const size = this.cacheSizes.get(cacheId)!;
    
    // If we were creating new cache
    if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
        // Switch back to main canvas
        this.switchRenderTarget(null);
        
        // Restore original offsets
        this.offsetX = this.savedOffsetX;
        this.offsetY = this.savedOffsetY;
        this.savedOffsetX = null;
        this.savedOffsetY = null;
    }
    
    // Draw cached content to main canvas at current position
    this.drawCachedTexture(texture, size.width, size.height);
    
    // Reset state
    this.isInCacheGroup = false;
    this.currentCacheId = null;
}
```

### Phase 4: Drawing Method Modifications
Modify all drawing methods (`drawSprite`, `drawLine`, `drawRectangle`, etc.) to check:
```typescript
// Skip drawing if we're in a cache group with existing cache
if (this.isInCacheGroup && this.savedOffsetX === null) {
    return; // Skip drawing operations
}
```

### Phase 5: Cache Management
Add comprehensive cache management methods:
```typescript
// Manual cache cleanup
clearCache(cacheId: string): void {
    if (!this.cacheMap.has(cacheId)) return;
    
    // Clean up WebGL resources
    const texture = this.cacheMap.get(cacheId)!;
    const framebuffer = this.cacheFramebuffers.get(cacheId)!;
    
    this.gl.deleteTexture(texture);
    this.gl.deleteFramebuffer(framebuffer);
    
    // Remove from all tracking structures
    this.cacheMap.delete(cacheId);
    this.cacheFramebuffers.delete(cacheId);
    this.cacheSizes.delete(cacheId);
    
    const index = this.cacheAccessOrder.indexOf(cacheId);
    if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
    }
}

clearAllCaches(): void {
    for (const cacheId of this.cacheMap.keys()) {
        this.clearCache(cacheId);
    }
}

// Cache limit management
setMaxCacheItems(limit: number): void {
    this.maxCacheItems = limit;
    this.enforceMaxCacheLimit();
}

private enforceMaxCacheLimit(): void {
    while (this.cacheMap.size >= this.maxCacheItems) {
        const oldestCacheId = this.cacheAccessOrder.shift();
        if (oldestCacheId) {
            this.clearCache(oldestCacheId);
        }
    }
}

private updateCacheAccess(cacheId: string): void {
    // Move to end of access order (most recently used)
    const index = this.cacheAccessOrder.indexOf(cacheId);
    if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
    }
    this.cacheAccessOrder.push(cacheId);
}

// Utility methods
getCacheExists(cacheId: string): boolean {
    return this.cacheMap.has(cacheId);
}

getCacheCount(): number {
    return this.cacheMap.size;
}

getCacheStats(): {count: number, maxItems: number, memoryEstimate: number} {
    let memoryEstimate = 0;
    for (const {width, height} of this.cacheSizes.values()) {
        memoryEstimate += width * height * 4; // RGBA bytes
    }
    
    return {
        count: this.cacheMap.size,
        maxItems: this.maxCacheItems,
        memoryEstimate
    };
}
```

## Technical Details

### Coordinate System
- When drawing to cache: offsets reset to (0,0)
- When drawing cache to canvas: use current offsets
- Original offsets preserved and restored

### WebGL Integration  
- Use framebuffer objects for offscreen rendering
- Create texture attachments for each cache
- Handle render target switching properly

### Error Handling
- Prevent cache group nesting with clear error messages
- Validate cache IDs and dimensions
- Handle WebGL context loss gracefully

### Memory Management
- **LRU Eviction**: Automatic cleanup of least recently used caches when limit reached
- **Manual Cleanup**: `clearCache(id)` and `clearAllCaches()` for explicit control
- **Configurable Limits**: `setMaxCacheItems(limit)` with default of 50 items
- **Memory Monitoring**: `getCacheStats()` provides memory usage estimates
- **Proper WebGL Cleanup**: All textures and framebuffers properly disposed

## Usage Example
```typescript
// Configure cache limit
engine.setMaxCacheItems(100);

// First call - creates cache
engine.startCacheGroup('ui-panel', 200, 100);
engine.drawSprite(10, 10, 'button'); // Rendered to cache
engine.drawText(20, 50, 'Menu');     // Rendered to cache  
engine.endCacheGroup(); // Cache created and drawn to canvas

// Subsequent calls - uses cache
engine.startCacheGroup('ui-panel', 200, 100);
engine.drawSprite(10, 10, 'button'); // Skipped
engine.drawText(20, 50, 'Menu');     // Skipped
engine.endCacheGroup(); // Cached texture drawn directly

// Manual cache management
engine.clearCache('ui-panel');       // Remove specific cache
engine.clearAllCaches();             // Clear all caches

// Monitor cache usage
const stats = engine.getCacheStats();
console.log(`${stats.count}/${stats.maxItems} caches, ${stats.memoryEstimate} bytes`);
```

## Success Criteria

- [ ] `startCacheGroup` and `endCacheGroup` functions implemented and working
- [ ] Cache storage system with WebGL framebuffers functioning properly
- [ ] LRU eviction system with configurable limits operational
- [ ] All drawing methods respect cache state (skip when using existing cache)
- [ ] Manual cache management methods (`clearCache`, `clearAllCaches`) working
- [ ] Memory usage monitoring via `getCacheStats()` accurate
- [ ] No performance regression for non-cached drawing operations
- [ ] Error handling prevents cache group nesting with clear messages

## Affected Components

- `packages/2d-engine/src/index.ts` - Main Engine class modifications
- `packages/2d-engine/src/utils/createTexture.ts` - May need updates for framebuffer textures
- All drawing methods (`drawSprite`, `drawLine`, `drawRectangle`, etc.) - Cache state checking
- Engine constructor - New cache-related properties initialization

## Risks & Considerations

- **WebGL Context Loss**: Cache textures lost on context loss, need graceful handling
- **Memory Usage**: Large caches could exceed device memory limits, mitigated by LRU eviction
- **Mobile Constraints**: Framebuffer limits on mobile devices, need fallback to direct rendering
- **Cache Invalidation**: No automatic invalidation in v1, users must manually clear when content changes
- **Breaking Changes**: None expected - new functionality only
- **Dependencies**: Requires existing WebGL context and texture creation utilities

## Related Items

- **Depends on**: None - standalone feature addition
- **Related**: `006-render-to-texture-capability.md` - Similar WebGL texture techniques

## References

- [WebGL Framebuffer Objects](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

## Notes

**Implementation Decisions**:
- No nesting allowed to keep state management simple
- LRU eviction chosen over other strategies for predictable behavior
- Manual invalidation preferred over automatic to avoid complexity
- 50-item default cache limit based on typical mobile GPU constraints

**Performance Considerations**:
- Framebuffer switching has overhead, so cache should be worthwhile
- Texture memory usage tracked but not strictly enforced (relies on LRU)
- Skip-drawing optimization crucial for cache effectiveness

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.