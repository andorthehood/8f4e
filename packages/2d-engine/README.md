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
- **Post-processing effects** - Flexible shader-based effects system with buffer-based uniforms
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

## Post-Processing Effects

The engine supports custom post-processing effects through a flexible shader-based system with buffer-managed uniforms.

### Basic Example

```typescript
import { Engine, PostProcessEffect } from '@8f4e/2d-engine';

// Create shared buffer for uniform values
const effectBuffer = new Float32Array(64);

// Define scanline effect
const scanlineEffect: PostProcessEffect = {
  name: 'scanlines',
  vertexShader: `
    precision mediump float;
    attribute vec2 a_position;
    varying vec2 v_screenCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_screenCoord = (a_position + 1.0) / 2.0;
    }
  `,
  fragmentShader: `
    precision mediump float;
    varying vec2 v_screenCoord;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform sampler2D u_renderTexture;
    uniform float u_scanlineIntensity;
    
    void main() {
      vec2 uv = v_screenCoord;
      vec3 color = texture2D(u_renderTexture, uv).rgb;
      
      // Create scanlines
      float scanline = sin(uv.y * u_resolution.y * 2.0) * 0.5 + 0.5;
      scanline = pow(scanline, 4.0);
      
      color *= scanline * u_scanlineIntensity;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    u_scanlineIntensity: { buffer: effectBuffer, offset: 0, size: 1 }
  },
  enabled: true
};

// Add effect to engine
engine.addPostProcessEffect(scanlineEffect);

// Update uniform values
engine.updatePostProcessUniforms({
  u_scanlineIntensity: 0.8
});
```

### Advanced Buffer Management

```typescript
// Create structured buffer layout
const effectBuffer = new Float32Array(64);

// Define buffer layout
const UNIFORMS = {
  SCANLINE_INTENSITY: 0,
  DISTORTION_AMOUNT: 1, 
  FLICKER_SPEED: 2,
  FLICKER_INTENSITY: 3,
  COLOR_TINT: 4 // vec3, uses offsets 4,5,6
};

// Multiple effects sharing buffer
const crtEffect: PostProcessEffect = {
  name: 'crt',
  vertexShader: '...', 
  fragmentShader: '...',
  uniforms: {
    u_distortion: { buffer: effectBuffer, offset: UNIFORMS.DISTORTION_AMOUNT },
    u_flicker: { buffer: effectBuffer, offset: UNIFORMS.FLICKER_SPEED },
    u_colorTint: { buffer: effectBuffer, offset: UNIFORMS.COLOR_TINT, size: 3 }
  }
};

// Update multiple values at once
engine.updatePostProcessUniforms({
  u_distortion: 0.2,
  u_flicker: 50.0,
  u_colorTint: [1.0, 0.8, 0.6] // sepia tint
});

// Or update buffer directly for performance
effectBuffer[UNIFORMS.DISTORTION_AMOUNT] = 0.25;
```

### Effect Management

```typescript
// Add multiple effects (rendered in sequence)
engine.addPostProcessEffect(distortionEffect);
engine.addPostProcessEffect(scanlineEffect);
engine.addPostProcessEffect(vignetteEffect);

// Toggle effects
engine.setPostProcessEffectEnabled('scanlines', false);
engine.setPostProcessEffectEnabled('scanlines', true);

// Remove effects
engine.removePostProcessEffect('vignette');

// Direct buffer access for high-performance updates
const buffer = engine.getPostProcessBuffer();
buffer[0] = Math.sin(Date.now() * 0.001) * 0.5; // animate scanline intensity
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

#### Post-Processing Effects
```typescript
// Add post-processing effect
addPostProcessEffect(effect: PostProcessEffect): void

// Remove effect
removePostProcessEffect(name: string): void

// Update uniform values in shared buffer
updatePostProcessUniforms(uniforms: Record<string, number | number[]>): void

// Enable/disable effect
setPostProcessEffectEnabled(name: string, enabled: boolean): void

// Get direct buffer access
getPostProcessBuffer(): Float32Array
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

type PostProcessEffect = {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms?: Record<string, UniformBufferMapping>;
  enabled?: boolean;
};

type UniformBufferMapping = {
  buffer: Float32Array;
  offset: number;
  size?: number; // 1 for float, 2 for vec2, 3 for vec3, 4 for vec4
};
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