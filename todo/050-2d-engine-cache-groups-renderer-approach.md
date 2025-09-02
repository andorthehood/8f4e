# 050 - 2D Engine Cache Groups - Renderer Inheritance Approach

**Priority**: 🟡
**Estimated Effort**: 1-2 days
**Created**: 2025-09-02
**Status**: Open
**Completed**: 

## Problem Description

The 2D engine currently redraws all UI elements and sprites every frame, even when they haven't changed. This creates performance bottlenecks for complex UI panels, frequently used game objects, and expensive drawing operations that could be cached and reused.

**Current State**: No caching implementation exists
**Impact**: Unnecessary GPU/CPU usage, potential frame rate drops, especially on mobile devices
**Why it's a Problem**: Performance degradation as scene complexity increases

## Proposed Solution

**Architecture Decision**: Implement caching at the **Renderer level** using inheritance, not at the Engine level.

**Key Insight**: Caching is fundamentally a WebGL concern (framebuffers, textures, render targets) and should be handled at the rendering layer, not the high-level API layer.

**High-level Approach**:
1. Create `CachedRenderer` that extends base `Renderer`
2. Create lightweight `CachedEngine` that uses `CachedRenderer`
3. Keep base `Engine` and `Renderer` completely cache-free

## Implementation Plan

### Phase 1: Core Cache Management
Create `CacheManager` class for pure cache logic:
```typescript
class CacheManager {
  private cacheMap: Map<string, WebGLTexture>
  private cacheFramebuffers: Map<string, WebGLFramebuffer>  
  private cacheSizes: Map<string, {width: number, height: number}>
  private cacheAccessOrder: string[] // For LRU tracking
  private maxCacheItems: number = 50
  
  startCacheGroup(cacheId: string, width: number, height: number): boolean
  endCacheGroup(): {texture: WebGLTexture, width: number, height: number} | null
  shouldSkipDrawing(): boolean
  clearCache(cacheId: string): void
  // ... other cache management methods
}
```

### Phase 2: Cached Renderer
Create `CachedRenderer` that extends base `Renderer`:
```typescript
class CachedRenderer extends Renderer {
  private cacheManager: CacheManager

  constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
    super(canvas)
    this.cacheManager = new CacheManager(this.gl, maxCacheItems)
  }

  // Override drawing methods to respect cache state
  drawSpriteFromCoordinates(...args): void {
    if (this.shouldSkipDrawing()) return
    super.drawSpriteFromCoordinates(...args)
  }

  drawLineFromCoordinates(...args): void {
    if (this.shouldSkipDrawing()) return
    super.drawLineFromCoordinates(...args)
  }

  // Cache-specific methods
  startCacheGroup(cacheId, width, height): boolean
  endCacheGroup(): CacheInfo | null
  drawCachedTexture(texture, width, height): void
}
```

### Phase 3: Cached Engine
Create simple `CachedEngine` using renderer inheritance:
```typescript
class CachedEngine extends Engine {
  private cachedRenderer: CachedRenderer
  private savedOffsetX: number | null = null
  private savedOffsetY: number | null = null

  constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
    super(canvas)
    // Replace renderer with cached version
    this.cachedRenderer = new CachedRenderer(canvas, maxCacheItems)
    this.renderer = this.cachedRenderer // Swap the renderer
  }

  startCacheGroup(cacheId: string, width: number, height: number) {
    // Handle offset management and delegate to renderer
  }

  endCacheGroup() {
    // Handle offset restoration and delegate to renderer
  }

  // Simple delegation methods for cache management
  clearCache(id) { this.cachedRenderer.clearCache(id) }
  // ... other cache methods
}
```

### Phase 4: Export Strategy
Provide multiple options for different use cases:
```typescript
// Base classes (no caching)
export { Engine } from './engine'
export { Renderer } from './renderer'

// Cached versions
export { CachedEngine } from './CachedEngine'
export { CachedRenderer } from './CachedRenderer'

// Standalone cache management
export { CacheManager } from './CacheManager'
```

## Architecture Benefits

### ✅ **Cleaner Separation of Concerns**
- `Renderer`: WebGL operations + caching at GPU level
- `Engine`: High-level API + transform management
- `CacheManager`: Pure cache logic

### ✅ **Simpler Implementation** 
- No method duplication in `CachedEngine`
- Direct inheritance leverages existing functionality
- Cache logic contained at appropriate abstraction level

### ✅ **Better Performance**
- No composition overhead
- Cache decisions made at optimal point in render pipeline
- Smaller memory footprint

### ✅ **User Choice**
- `Engine` + `Renderer`: Lightweight, no caching
- `CachedEngine` + `CachedRenderer`: Full caching capabilities
- `CacheManager`: Custom integration scenarios

## Technical Implementation Details

### Framebuffer Management
- Create offscreen framebuffers in `CacheManager`
- Switch render targets at `CachedRenderer` level
- Handle WebGL state management properly

### Cache Invalidation Strategy
- LRU eviction with configurable limits
- Manual cache clearing methods
- No automatic invalidation (keep simple)

### Coordinate System Handling
- Save/restore offsets in `CachedEngine`
- Reset to (0,0) when creating new cache
- Restore original offsets after cache creation

### Error Handling
- Prevent cache group nesting
- Validate framebuffer completeness
- Handle WebGL context loss gracefully

## Success Criteria

- [ ] `CacheManager` class with pure cache logic implemented
- [ ] `CachedRenderer` extending base `Renderer` with cache awareness
- [ ] `CachedEngine` using inheritance approach (minimal code)
- [ ] All drawing operations respect cache state at renderer level
- [ ] LRU eviction system with configurable limits
- [ ] Manual cache management methods working
- [ ] Memory usage monitoring accurate
- [ ] No performance regression for non-cached operations
- [ ] Comprehensive test coverage for all components
- [ ] Clear examples showing different usage patterns

## Usage Examples

```typescript
// Option 1: Lightweight (no caching)
import { Engine } from '@8f4e/2d-engine'
const engine = new Engine(canvas)

// Option 2: Full caching capabilities
import { CachedEngine } from '@8f4e/2d-engine'
const engine = new CachedEngine(canvas, maxCacheItems)

engine.startCacheGroup('ui-panel', 200, 100)
engine.drawSprite(10, 10, 'button')
engine.drawText(20, 50, 'Menu')
engine.endCacheGroup() // Cached for future frames

// Option 3: Custom renderer integration
import { CachedRenderer } from '@8f4e/2d-engine'
const renderer = new CachedRenderer(canvas)
// Build custom engine using cached renderer
```

## Migration Benefits

### From Current Composition Approach:
- **50% less code** in `CachedEngine` class
- **Better performance** due to inheritance vs composition
- **Cleaner architecture** with concerns at right abstraction levels
- **Same public API** - no breaking changes for users

### Testing Strategy:
- Unit tests for `CacheManager` (cache logic)
- Unit tests for `CachedRenderer` (WebGL integration)  
- Integration tests for `CachedEngine` (high-level API)
- Performance benchmarks comparing approaches

## Implementation Notes

**Why This Approach is Superior:**
1. **Natural Layering**: Cache operations happen where WebGL operations happen
2. **Code Reuse**: Leverage inheritance instead of duplicating methods
3. **Performance**: No composition overhead, direct method calls
4. **Maintainability**: Changes to base classes automatically inherited
5. **Bundle Size**: Smaller footprint due to inheritance vs composition

**Key Insight**: Caching is not a feature of the high-level API - it's an optimization at the rendering layer. By implementing it at the `Renderer` level, we get better architecture and simpler code.

## Affected Files

- `src/CacheManager.ts` - New: Pure cache logic
- `src/CachedRenderer.ts` - New: Renderer with cache capabilities  
- `src/CachedEngine.ts` - New: Engine using cached renderer
- `src/index.ts` - Updated: Export new classes
- `tests/` - New comprehensive test suite
- `examples/` - New usage examples

## References

- Previous implementation analysis showing composition complexity
- WebGL framebuffer best practices
- Performance comparison data favoring inheritance approach