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
1. Create `CachedRenderer` that extends base `Renderer` with integrated cache management
2. Create lightweight `CachedEngine` that uses `CachedRenderer`
3. Keep base `Engine` and `Renderer` completely cache-free

## Implementation Plan

### Phase 1: Cached Renderer (Merged Approach)
Create `CachedRenderer` that extends base `Renderer` with integrated cache management:
```typescript
class CachedRenderer extends Renderer {
  // Cache state integrated directly (no separate CacheManager)
  private cacheMap: Map<string, WebGLTexture>
  private cacheFramebuffers: Map<string, WebGLFramebuffer>  
  private cacheSizes: Map<string, {width: number, height: number}>
  private cacheAccessOrder: string[] // For LRU tracking
  private maxCacheItems: number = 50
  private currentCacheId: string | null = null
  private currentCacheFramebuffer: WebGLFramebuffer | null = null

  constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
    super(canvas)
    this.maxCacheItems = maxCacheItems
    this.cacheMap = new Map()
    this.cacheFramebuffers = new Map()
    this.cacheSizes = new Map()
    this.cacheAccessOrder = []
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

  // Cache management methods (integrated directly)
  startCacheGroup(cacheId: string, width: number, height: number): boolean
  endCacheGroup(): {texture: WebGLTexture, width: number, height: number} | null
  shouldSkipDrawing(): boolean
  clearCache(cacheId: string): void
  drawCachedTexture(texture: WebGLTexture, width: number, height: number): void
  // ... other cache management methods
}
```

### Phase 2: Cached Engine
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

### Phase 3: Export Strategy
Provide multiple options for different use cases:
```typescript
// Base classes (no caching)
export { Engine } from './engine'
export { Renderer } from './renderer'

// Cached versions
export { CachedEngine } from './CachedEngine'
export { CachedRenderer } from './CachedRenderer'
```

## Architecture Benefits

### ✅ **Cleaner Separation of Concerns**
- `Renderer`: WebGL operations + caching at GPU level
- `Engine`: High-level API + transform management
- **No artificial separation** between cache logic and WebGL operations

### ✅ **Simpler Implementation** 
- Integrated cache management
- Direct access to WebGL context and existing state
- No coordination overhead between separate classes
- Cache logic integrated where WebGL operations happen

### ✅ **Better Performance**
- No composition overhead
- No need to pass WebGL context between classes
- Cache decisions made at optimal point in render pipeline
- Smaller memory footprint

### ✅ **User Choice**
- `Engine` + `Renderer`: Lightweight, no caching
- `CachedEngine` + `CachedRenderer`: Full caching capabilities

## Technical Implementation Details

### Framebuffer Management
- Create offscreen framebuffers directly in `CachedRenderer`
- Switch render targets at renderer level
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

- [ ] `CachedRenderer` extending base `Renderer` with integrated cache management
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
- **Minimal code** in `CachedEngine` class
- **Better performance** due to inheritance vs composition
- **Cleaner architecture** with concerns at right abstraction levels
- **Same public API** - no breaking changes for users

### From Separate CacheManager Approach:
- **Simpler architecture** to maintain and test
- **Direct access** to WebGL context and existing state
- **No coordination overhead** between components
- **Simpler API** - all cache operations are methods on the renderer

### Testing Strategy:
- Unit tests for `CachedRenderer` (WebGL integration + cache logic)  
- Integration tests for `CachedEngine` (high-level API)
- Performance benchmarks comparing approaches

## Implementation Notes

**Why This Merged Approach is Superior:**
1. **Natural Integration**: Cache operations happen where WebGL operations happen
2. **No Artificial Boundaries**: No need to separate cache logic from WebGL state
3. **Direct Access**: Cache management has direct access to WebGL context and renderer state
4. **Simpler State Management**: All cache operations integrated in one place
5. **Better Performance**: No composition overhead, direct method calls
6. **Maintainability**: Changes to base classes automatically inherited
7. **Bundle Size**: Smaller footprint with integrated approach

**Key Insight**: Caching is not a feature of the high-level API - it's an optimization at the rendering layer. By implementing it directly in the `CachedRenderer` class, we get better architecture, simpler code, and better performance.

## Affected Files

- `src/CachedRenderer.ts` - New: Renderer with integrated cache capabilities  
- `src/CachedEngine.ts` - New: Engine using cached renderer
- `src/index.ts` - Updated: Export new classes
- `tests/` - New comprehensive test suite
- `examples/` - New usage examples

## References

- Previous implementation analysis showing composition complexity
- WebGL framebuffer best practices
- Performance comparison data favoring inheritance approach
- Analysis showing integrated approach reduces complexity
