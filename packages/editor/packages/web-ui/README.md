# Web UI Package

This package provides a web-based UI renderer for the editor. It renders the UI purely from
the editor state and memory views, treating state as immutable input, and is designed to be
replaceable by renderers for other platforms.

## API

### `init(state, canvas, memoryViews, spriteData)`

Initializes the web UI renderer.

**Parameters:**
- `state: State` - The editor state (read-only)
- `canvas: HTMLCanvasElement` - The canvas element to render to
- `memoryViews: MemoryViews` - Memory view interfaces for rendering code blocks
- `spriteData: SpriteData` - Pre-generated sprite sheet and lookups from `@8f4e/sprite-generator`

**Returns:** An object with methods to control the renderer:
- `resize(width, height)` - Resize the canvas
- `reloadSpriteSheet()` - Regenerate the sprite sheet and return new `SpriteData`
- `loadPostProcessEffect(effect)` - Load a post-process effect
- `loadBackgroundEffect(effect)` - Load a background effect
- `clearCache()` - Clear the rendering cache

### `SpriteData`

Type representing sprite sheet data:
```typescript
interface SpriteData {
  canvas: OffscreenCanvas;         // The sprite sheet canvas
  spriteLookups: SpriteLookups;    // Lookup tables for sprite coordinates
  characterWidth: number;          // Character width in pixels
  characterHeight: number;         // Character height in pixels
}
```

## State Usage

The web-ui package reads from the editor state but does **not** mutate it (except for temporary
viewport adjustments during the render loop). The sprite lookups, grid sizes, and other sprite-related
data must be provided by the caller via the `spriteData` parameter and updated when
`reloadSpriteSheet()` is called.
