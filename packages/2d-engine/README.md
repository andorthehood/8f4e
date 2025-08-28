# 2D Engine

A minimal WebGL-based 2D rendering engine designed specifically for sprite sheet rendering.

## Philosophy

This engine was built as a WebGL learning exercise with a focus on minimalism over feature completeness. The goal was to create a no-bloat rendering engine that does one thing well: efficiently rendering sprites from a sprite sheet.

**Core principles:**
- **Minimal feature set** - Only essential sprite rendering functionality
- **Performance over safety** - Optimized for speed with minimal error checking
- **Educational focus** - Clean, readable WebGL code for learning purposes
- **No dependencies** - Pure WebGL implementation without external libraries
- **Retro aesthetic** - Designed specifically for pixel-perfect, anti-aliasing-free rendering

## Features

- **Sprite-only rendering** - Optimized for rendering sprites from a single sprite sheet
- **WebGL backend** - Hardware-accelerated rendering with custom shaders
- **Batched rendering** - Efficient buffer management for high performance
- **Pixel-perfect rendering** - No anti-aliasing, nearest-neighbor filtering for retro pixelated look
- **Performance monitoring** - Built-in FPS and render time tracking

## Quick Start

```typescript
import { Engine, SpriteLookup } from '@8f4e/2d-engine';

// Initialize engine
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const engine = new Engine(canvas);

// Load sprite sheet
const spriteSheet = new Image();
spriteSheet.onload = () => {
  engine.loadSpriteSheet(spriteSheet);
  
  // Define sprite locations
  const sprites: SpriteLookup = {
    'player': { x: 0, y: 0, spriteWidth: 32, spriteHeight: 32 },
    'enemy': { x: 32, y: 0, spriteWidth: 32, spriteHeight: 32 }
  };
  engine.setSpriteLookup(sprites);
  
  // Start rendering
  engine.render((timeToRender, fps, triangles, maxTriangles) => {
    engine.drawSprite(100, 100, 'player');
    engine.drawSprite(200, 150, 'enemy');
  });
};
spriteSheet.src = 'spritesheet.png';
```

## API Reference

### Engine Class

#### Constructor
```typescript
new Engine(canvas: HTMLCanvasElement)
```

#### Sprite Methods
```typescript
// Draw sprite by lookup key
drawSprite(x: number, y: number, sprite: string | number, width?: number, height?: number): void

// Draw sprite by coordinates
drawSpriteFromCoordinates(x: number, y: number, width: number, height: number, 
                         spriteX: number, spriteY: number, spriteWidth?: number, spriteHeight?: number): void

// Load sprite sheet texture
loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas): void

// Set sprite lookup table
setSpriteLookup(spriteLookup: SpriteLookup): void
```

#### Drawing Methods
```typescript
// Draw line with thickness (uses geometric calculation, not rectangular sprites)
drawLine(x1: number, y1: number, x2: number, y2: number, sprite: string | number, thickness: number): void

// Draw text using sprite font
drawText(x: number, y: number, text: string, sprites?: Array<SpriteLookup | undefined>): void
```

#### Transform Groups
```typescript
// Start transform group with offset
startGroup(x: number, y: number): void

// End current transform group
endGroup(): void
```

#### Utility Methods
```typescript
// Start render loop
render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void): void

// Resize canvas
resize(width: number, height: number): void

// Set shader uniform
setUniform(name: string, ...values: number[]): void
```

### Types

```typescript
type SpriteCoordinates = {
  spriteWidth: number;
  spriteHeight: number;
  x: number;
  y: number;
};

type SpriteLookup = Record<string | number, SpriteCoordinates>;
```

## Performance

- **Buffer size**: Configurable (default: 20,000 triangles)
- **Rendering**: Batched triangles with single draw call
- **Memory**: Pre-allocated Float32Array buffers
- **Blending**: Premultiplied alpha for proper transparency
- **Anti-aliasing**: Disabled on WebGL context and textures for retro pixel art

## Architecture Notes

- **Performance-first**: Optimized for speed over safety - minimal error checking and validation
- **Rectangular rendering**: All drawing uses rectangular sprites except `drawLine()`
- **Line geometry**: Lines use trigonometric calculation to create thick lines with proper angles
- **Pixel-perfect**: Even geometric lines maintain pixelated appearance due to disabled anti-aliasing
- **Auto-flush rendering**: Buffer automatically flushes and renders when full to prevent overflow

## Limitations

- Single sprite sheet only
- No rotation or scaling transforms (use groups for positioning)
- WebGL context required
- No built-in animation system

## License

MIT