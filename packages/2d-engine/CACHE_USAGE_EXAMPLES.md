# 2D Engine Cache Groups - Usage Examples

This document demonstrates how to use the new cache groups functionality in the 2D engine for performance optimization.

## Basic Usage

### Option 1: Lightweight Engine (No Caching)
```typescript
import { Engine } from '@8f4e/2d-engine';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const engine = new Engine(canvas);

// Use normally - no caching functionality
engine.drawSprite(10, 10, 'button');
```

### Option 2: Cached Engine (Full Caching)
```typescript
import { CachedEngine } from '@8f4e/2d-engine';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const engine = new CachedEngine(canvas, 50); // Max 50 cached items

// First frame - creates cache and renders to it
engine.startCacheGroup('ui-panel', 200, 100);
engine.drawSprite(10, 10, 'button');
engine.drawText(20, 50, 'Menu');
engine.drawLine(0, 0, 200, 0, 'border', 2);
engine.endCacheGroup(); // Cache created and drawn to main canvas

// Subsequent frames - skips drawing, uses cached texture
engine.startCacheGroup('ui-panel', 200, 100);
engine.drawSprite(10, 10, 'button'); // ← Skipped!
engine.drawText(20, 50, 'Menu');     // ← Skipped!
engine.drawLine(0, 0, 200, 0, 'border', 2); // ← Skipped!
engine.endCacheGroup(); // Cached texture drawn directly
```

### Option 3: Custom Renderer Integration
```typescript
import { CachedRenderer } from '@8f4e/2d-engine';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new CachedRenderer(canvas, 100);

// Build custom engine using cached renderer
// Advanced use case for fine-grained control
```

## Performance Benefits

### Before Caching
```typescript
// Every frame: expensive GPU operations
for (let frame = 0; frame < 1000; frame++) {
  engine.drawSprite(10, 10, 'button');    // GPU draw call
  engine.drawText(20, 50, 'Menu');        // GPU draw call
  engine.drawSprite(50, 10, 'icon');      // GPU draw call
  // ... more drawing operations
}
```

### After Caching
```typescript
// First frame: cache creation
engine.startCacheGroup('ui-panel', 200, 100);
engine.drawSprite(10, 10, 'button');    // GPU draw call (to cache)
engine.drawText(20, 50, 'Menu');        // GPU draw call (to cache)  
engine.drawSprite(50, 10, 'icon');      // GPU draw call (to cache)
engine.endCacheGroup(); // Cache created

// Subsequent frames: single texture draw
for (let frame = 1; frame < 1000; frame++) {
  engine.startCacheGroup('ui-panel', 200, 100);
  engine.drawSprite(10, 10, 'button');  // ← Skipped!
  engine.drawText(20, 50, 'Menu');      // ← Skipped!
  engine.drawSprite(50, 10, 'icon');    // ← Skipped!
  engine.endCacheGroup(); // Single GPU texture draw
}
```

## Advanced Usage

### Cache Management
```typescript
// Configure cache limit
engine.setMaxCacheItems(100);

// Check cache status
console.log(`Caches: ${engine.getCacheCount()}/${engine.getCacheStats().maxItems}`);
console.log(`Memory: ${engine.getCacheStats().memoryEstimate} bytes`);

// Manual cache management
engine.clearCache('ui-panel');     // Remove specific cache
engine.clearAllCaches();           // Clear all caches

// Check if cache exists
if (engine.getCacheExists('ui-panel')) {
  console.log('Cache exists, will reuse');
}
```

### Integration with Transform Groups
```typescript
// Cache groups work with transform groups
engine.startGroup(100, 50); // Offset all subsequent draws

engine.startCacheGroup('offset-ui', 200, 100);
engine.drawSprite(10, 10, 'button'); // Drawn at (10, 10) relative to cache
engine.endCacheGroup(); // Cache drawn at (100, 50) due to transform

engine.endGroup(); // Restore transform
```

### Dynamic Cache Invalidation
```typescript
// When content changes, clear the cache to force recreation
function updateButtonState(isPressed: boolean) {
  if (isPressed !== previousState) {
    engine.clearCache('button-ui'); // Force recreation on next frame
    previousState = isPressed;
  }
}

// Use cache as normal
engine.startCacheGroup('button-ui', 100, 50);
engine.drawSprite(10, 10, isPressed ? 'button-pressed' : 'button-normal');
engine.endCacheGroup();
```

### Complex UI Panels
```typescript
function drawComplexPanel() {
  engine.startCacheGroup('game-ui', 400, 300);
  
  // Background
  engine.drawSprite(0, 0, 'panel-bg', 400, 300);
  
  // Buttons
  for (let i = 0; i < 5; i++) {
    engine.drawSprite(50 + i * 60, 50, 'button');
    engine.drawText(60 + i * 60, 60, `Btn ${i}`);
  }
  
  // Status indicators
  engine.drawText(20, 20, `Health: ${playerHealth}`);
  engine.drawText(20, 40, `Score: ${playerScore}`);
  
  // Decorative elements
  for (let i = 0; i < 10; i++) {
    engine.drawSprite(i * 40, 250, 'decoration');
  }
  
  engine.endCacheGroup();
}

// First call: expensive (renders ~20 sprites + text)
drawComplexPanel();

// Subsequent calls: fast (single texture draw)
drawComplexPanel();
drawComplexPanel();
```

## Best Practices

### ✅ Good Use Cases
- Static UI panels that don't change frequently
- Complex decorative elements 
- Repeating patterns or tiled backgrounds
- Menu systems that appear/disappear
- Status displays that update infrequently

### ❌ Avoid Caching For
- Content that changes every frame
- Single sprites (overhead not worth it)
- Very small UI elements (< 50x50 pixels)
- Animations or dynamic content

### Memory Management
```typescript
// Monitor cache usage
function monitorCacheUsage() {
  const stats = engine.getCacheStats();
  console.log(`Cache usage: ${stats.count}/${stats.maxItems} items`);
  console.log(`Memory estimate: ${(stats.memoryEstimate / 1024 / 1024).toFixed(2)} MB`);
  
  // Clear old caches if memory usage is high
  if (stats.memoryEstimate > 50 * 1024 * 1024) { // 50MB threshold
    engine.setMaxCacheItems(Math.max(10, stats.maxItems - 10));
  }
}
```

### Error Handling
```typescript
try {
  engine.startCacheGroup('ui-panel', 200, 100);
  // ... drawing operations
  engine.endCacheGroup();
} catch (error) {
  console.warn('Cache group failed:', error);
  // Fallback to direct rendering
  engine.drawSprite(10, 10, 'button');
  engine.drawText(20, 50, 'Menu');
}
```

## Architecture Benefits

The renderer inheritance approach provides:

- **Zero Breaking Changes**: Existing code works unchanged
- **User Choice**: Use `Engine` for lightweight, `CachedEngine` for optimization
- **Better Performance**: No composition overhead, direct method calls
- **Cleaner Architecture**: Cache logic at appropriate WebGL abstraction level
- **Smaller Bundle**: Inheritance reduces code duplication vs composition

## Migration Guide

### From Standard Engine
```typescript
// Before
import { Engine } from '@8f4e/2d-engine';
const engine = new Engine(canvas);

// After - minimal change for caching
import { CachedEngine } from '@8f4e/2d-engine';
const engine = new CachedEngine(canvas);

// All existing code works unchanged
engine.drawSprite(10, 10, 'sprite');
engine.startGroup(50, 50);
// ... etc
```

### Adding Cache Groups
```typescript
// Identify expensive drawing sequences
function drawExpensiveUI() {
  // Wrap with cache group
  engine.startCacheGroup('expensive-ui', 300, 200);
  
  // Existing drawing code - no changes needed
  engine.drawSprite(10, 10, 'bg');
  engine.drawText(20, 20, 'Title');
  // ... more drawing
  
  engine.endCacheGroup();
}
```

This cache system provides significant performance improvements for complex UIs while maintaining the same simple API.