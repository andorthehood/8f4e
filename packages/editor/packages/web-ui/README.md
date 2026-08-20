# Web UI Package

This package provides a web-based UI renderer for the editor. It renders the UI purely from
the editor state and memory views, treating state as immutable input, and is designed to be
replaceable by renderers for other platforms.

Rendering is backed by `glugglug2`. Sprite names are resolved to dense numeric IDs when the atlas is generated, so
per-frame drawers submit only positions, sizes, and numeric IDs. Shader backgrounds and WebAssembly RGBA frames are
drawn below the sprites, while connections are drawn as a line overlay above them.

## API

### `init(state, canvas, memoryViews, spriteData, options?)`

Initializes the web UI renderer.

**Parameters:**

- `state: State` - The editor state (read-only)
- `canvas: HTMLCanvasElement` - The canvas element to render to
- `memoryViews: MemoryViews` - Memory view interfaces for rendering code blocks
- `spriteData: SpriteData` - Pre-generated numeric atlas data from `@8f4e/sprite-generator`
- `options.onRenderStats` - Optional callback for sampled render statistics
- `options.renderStatsIntervalFrames` - Optional frame interval for `onRenderStats` (defaults to 60)

**Returns:** An object with methods to control the renderer:

- `resize(width, height)` - Resize the canvas
- `loadSpriteAtlas(spriteData)` - Replace the atlas and its derived drawing data
- `loadPostProcessEffect(effect)` - Load a post-process effect
- `loadBackgroundEffect(effect)` - Load a background effect
- `renderFrame()` - Draw one frame on demand
- `destroy()` - Release renderer and plugin resources

### `RenderStats`

Type emitted by `options.onRenderStats`:
```typescript
interface RenderStats {
  timeToRenderMs: number;
  fps: number; // Calculated over the sampled frame interval
  frameBudgetMs: number;
  headroomMs: number;
  fpsCapacity: number;
  spriteCount: number;
  uploadedInstanceBytes: number;
}
```

### `SpriteData`

Type representing sprite sheet data:
```typescript
interface SpriteData {
  spriteAtlas: SpriteAtlas<SpriteIdLookups>;
  lineColors: SpriteLineColors;
  characterWidth: number;
  characterHeight: number;
}
```

## State Usage

The web-ui package reads from the editor state but does **not** mutate it. Numeric sprite IDs and grid sizes are
installed by the editor when sprite data is generated. Atlas and font changes are explicit and are applied through
`loadSpriteAtlas()`.

## Docs

- [Drawer best practices](docs/drawer-best-practices.md)
