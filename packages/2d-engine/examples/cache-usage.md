# 2D Engine Cache Groups Examples

This document demonstrates how to use the cache groups feature in the 2D engine for improved performance.

## Basic Usage Examples

### Option 1: Lightweight Engine (No Caching)

```typescript
import { Engine } from '@8f4e/2d-engine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas);

// Standard drawing operations - no caching overhead
engine.render((timeToRender, fps, triangles, maxTriangles) => {
    engine.drawSprite(10, 10, 'player');
    engine.drawSprite(50, 50, 'enemy');
});
```

### Option 2: Cached Engine (Full Caching Capabilities)

```typescript
import { Engine } from '@8f4e/2d-engine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, { caching: true, maxCacheItems: 50 }); // Enable caching

// Cache UI panel that doesn't change often
engine.cacheGroup('ui-panel', 200, 100, () => {
    engine.drawSprite(10, 10, 'button');
    engine.drawSprite(60, 10, 'button');
    engine.drawText(20, 50, 'Menu');
}); // Now cached for future frames

engine.render((timeToRender, fps, triangles, maxTriangles) => {
    // Draw cached UI panel - very fast!
    engine.drawCachedContent('ui-panel', 0, 0);
    
    // Draw dynamic content normally
    engine.drawSprite(player.x, player.y, 'player');
});
```

### Option 3: Custom Integration

```typescript
import { Engine } from '@8f4e/2d-engine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, { caching: true, maxCacheItems: 30 });

function cacheComplexUI() {
    engine.cacheGroup('complex-ui', 400, 300, () => {
        // Draw complex UI elements...
    });
}
```

## Advanced Usage Patterns

### Complex UI Caching

```typescript
import { Engine } from '@8f4e/2d-engine';

const engine = new Engine(canvas, { caching: true });

// Cache different UI states
function cacheGameUI() {
    // Main menu
    engine.cacheGroup('main-menu', 400, 300, () => {
        engine.drawSprite(100, 50, 'title-logo');
        engine.drawSprite(150, 150, 'play-button');
        engine.drawSprite(150, 200, 'settings-button');
    });
    
    // Pause menu
    engine.cacheGroup('pause-menu', 300, 200, () => {
        engine.drawSprite(100, 50, 'pause-title');
        engine.drawSprite(125, 100, 'resume-button');
        engine.drawSprite(125, 150, 'quit-button');
    });
    
    // HUD elements
    engine.cacheGroup('hud-static', 800, 100, () => {
        engine.drawSprite(10, 10, 'health-bar-bg');
        engine.drawSprite(10, 50, 'mana-bar-bg');
    });
}

// Call once at startup
cacheGameUI();

// Use in render loop
engine.render((timeToRender, fps, triangles, maxTriangles) => {
    if (gameState === 'menu') {
        engine.drawCachedContent('main-menu', 200, 150);
    } else if (gameState === 'paused') {
        engine.drawCachedContent('pause-menu', 250, 200);
    } else {
        // Draw dynamic HUD over static background
        engine.drawCachedContent('hud-static', 0, 0);
        engine.drawSprite(15, 15, `health-${player.health}`);
        engine.drawSprite(15, 55, `mana-${player.mana}`);
    }
});
```

### Dynamic Content with Caching

```typescript
import { CachedEngine } from '@8f4e/2d-engine';

const engine = new CachedEngine(canvas);

class ParticleSystem {
    private lastCacheTime = 0;
    private cacheId = 'particle-system';
    
    update(currentTime: number) {
        // Re-cache particle system every 100ms for smooth animation
        if (currentTime - this.lastCacheTime > 100) {
            this.cacheParticles();
            this.lastCacheTime = currentTime;
        }
    }
    
    private cacheParticles() {
        engine.cacheGroup(this.cacheId, 400, 400, () => {
            // Draw all particles to cache
            for (const particle of this.particles) {
                engine.drawSprite(particle.x, particle.y, 'particle');
            }
        });
    }
    
    render() {
        engine.drawCachedContent(this.cacheId, 0, 0);
    }
}
```

### Memory Management

```typescript
import { Engine } from '@8f4e/2d-engine';

const engine = new Engine(canvas, { caching: true, maxCacheItems: 20 }); // Limit to 20 cached items

// Monitor cache usage
function debugCacheUsage() {
    const stats = engine.getCacheStats();
    console.log(`Cache: ${stats.itemCount}/${stats.maxItems} items`);
    console.log('Access order:', stats.accessOrder);
}

// Clear specific cache when no longer needed
function onLevelComplete() {
    engine.clearCache('level-background');
    engine.clearCache('level-ui');
}

// Clear all cache on major state changes
function onGameRestart() {
    engine.clearAllCache();
}

// Conditional caching based on performance
function adaptiveCaching() {
    const stats = engine.getCacheStats();
    
    if (stats.itemCount < stats.maxItems * 0.8) {
        // Cache more aggressively when we have space
        cacheComplexElements();
    } else {
        // Use cache more conservatively when near limit
        clearOldCaches();
    }
}
```

### Transform Groups with Caching

```typescript
import { CachedEngine } from '@8f4e/2d-engine';

const engine = new CachedEngine(canvas);

// Cache content that will be transformed
engine.cacheGroup('entity-sprite', 64, 64, () => {
    engine.drawSprite(0, 0, 'entity-base');
    engine.drawSprite(16, 16, 'entity-detail');
});

engine.render(() => {
    // Use transform groups to position cached content
    for (const entity of entities) {
        engine.startGroup(entity.x, entity.y);
        
        // This cached content will be drawn at entity position
        engine.drawCachedContent('entity-sprite', 0, 0);
        
        engine.endGroup();
    }
});
```

## Performance Considerations

### When to Use Caching

✅ **Good candidates for caching:**
- Static UI elements (menus, HUD backgrounds)
- Complex repeated sprites (detailed characters, buildings)
- Particle systems with many similar elements
- Background layers that don't change often

❌ **Poor candidates for caching:**
- Single sprites drawn once per frame
- Content that changes every frame
- Very large textures (limited by GPU memory)

### Cache Size Guidelines

```typescript
// Small UI elements
engine.cacheGroup('button', 100, 50, () => {});

// Medium UI panels
engine.cacheGroup('inventory', 300, 400, () => {});

// Large backgrounds (use sparingly)
engine.cacheGroup('level-bg', 1024, 768, () => {});
```

### Memory Usage

```typescript
// Monitor memory usage
function estimateCacheMemory() {
    const stats = engine.getCacheStats();
    
    // Rough estimate: RGBA * width * height * itemCount
    // This is just for monitoring - actual GPU memory may vary
    console.log(`Estimated cache items: ${stats.itemCount}`);
}
```

## Migration from Non-Cached Engine

```typescript
// Before: Standard engine
const engine = new Engine(canvas);

// After: Enable caching with unified API  
const engine = new Engine(canvas, { caching: true });

// All existing code continues to work unchanged
engine.drawSprite(10, 10, 'player');
engine.startGroup(x, y);
// ... etc

// Add caching for performance improvements
engine.cacheGroup('ui', 200, 100, () => {
  // ... draw UI elements
});

// Use cached content
engine.drawCachedContent('ui', 0, 0);
```

## Migration from CachedEngine

```typescript
// Before: Separate CachedEngine class
import { CachedEngine } from '@8f4e/2d-engine';
const engine = new CachedEngine(canvas, 50);

// After: Unified Engine with caching option
import { Engine } from '@8f4e/2d-engine';
const engine = new Engine(canvas, { caching: true, maxCacheItems: 50 });

// All caching methods remain identical
engine.cacheGroup('ui', 200, 100, () => { /* ... */ });
engine.drawCachedContent('ui', 0, 0);
engine.getCacheStats();
```
