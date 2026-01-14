# Viewport Feature

## Purpose

Manages viewport interactions and transformations: panning, resizing, snap-to-grid behavior, and centering operations. Provides the foundation for spatial navigation in the editor.

## Key Behaviors

- **Viewport Dragging**: Pan the viewport by dragging with mouse or touch
- **Resize Operations**: Adjust viewport dimensions and zoom levels
- **Snap-to-Grid**: Grid-aligned positioning for code blocks and viewport
- **Centering Helpers**: Utilities to center viewport on specific code blocks or coordinates
- **Coordinate Transformations**: Convert between screen space, viewport space, and grid space

## Events & Callbacks

### Events Listened To

- Viewport drag events (start, move, end)
- Resize events
- Center viewport events

### State Touched

- `state.graphicHelper.viewport.x` - Viewport horizontal position (pixels)
- `state.graphicHelper.viewport.y` - Viewport vertical position (pixels)
- `state.graphicHelper.viewport.vGrid` - Vertical grid size (pixels)
- `state.graphicHelper.viewport.hGrid` - Horizontal grid size (pixels)
- `state.graphicHelper.viewport.width` - Viewport width (pixels)
- `state.graphicHelper.viewport.height` - Viewport height (pixels)

## Coordinate Systems

### Screen Space
- Pixel coordinates relative to browser window
- Origin at top-left of viewport element

### Viewport Space
- Pixel coordinates relative to viewport origin
- Affected by viewport pan/zoom
- `viewportX = screenX + viewport.x`

### Grid Space
- Grid-aligned coordinates for persistence
- `gridX = Math.round(viewportX / hGrid)`
- Used in project serialization

## Viewport Operations

### Panning
- Drag to move viewport position
- Updates `viewport.x` and `viewport.y`

### Snap-to-Grid
- Aligns coordinates to grid boundaries
- Used for clean block positioning

### Centering
- `centerViewportOnCodeBlock(block)` - Centers view on specific block
- Adjusts viewport to bring target into view

### Border Calculations
- Computes visible viewport boundaries
- Used for culling off-screen blocks

## Integration Points

- **Code Blocks**: Block positions are in viewport coordinates
- **Code Block Dragger**: Uses viewport for drag operations
- **Project Export**: Viewport position is converted to grid coordinates for saving
- **Project Import**: Grid coordinates are converted back to viewport pixels

## References

- Border calculations: `calculateBorderLineCoordinates.ts`
- Centering logic: `centerViewportOnCodeBlock.ts`
- Grid snapping: `snapToGrid.ts`
- Viewport movement: `move.ts`
- Resize operations: `resize.ts`

## Notes & Limitations

- Viewport position is relative to an implicit canvas origin
- Grid sizes are configurable but typically uniform
- Zoom is not yet implemented (viewport size only)
- Coordinate conversions may lose sub-grid precision
- Viewport state is persisted in projects for consistency
