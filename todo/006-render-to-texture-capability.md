# TODO: Add Render-to-Texture Capability to 2D Engine

**Priority**: 🟡  
**Estimated Effort**: 1-2 days  
**Created**: 2024-12-19  
**Status**: Open  

## Problem Description

Currently, the 2d-engine renders all text as individual character sprites, creating many vertices per frame. For text that doesn't change often (like code blocks), this is inefficient:

- Each character generates 6 vertices (2 triangles)
- Large code blocks can create thousands of vertices per frame
- Text is re-rendered even when only cursor position changes
- No caching mechanism for static content

This impacts performance, especially with many code blocks containing lots of text.

## Proposed Solution

Add generic render-to-texture capabilities to the 2d-engine without making it code-specific:

- Add methods to create render textures (framebuffers)
- Add method to render content to a texture
- Add method to draw textures as sprites
- Keep all caching logic in the editor package
- Maintain 2d-engine's generic nature

## Implementation Plan

### Step 1: Add Render Texture Creation
- Add `createRenderTexture(width, height)` method to Engine class
- Creates WebGL texture and framebuffer pair
- Returns both texture and framebuffer references
- Expected outcome: Can create off-screen render targets

### Step 2: Add Render-to-Texture Method
- Add `renderToTexture(framebuffer, width, height, renderCallback)` method
- Switches to framebuffer, executes callback, restores main framebuffer
- Handles viewport changes and state restoration
- Expected outcome: Can render content to textures

### Step 3: Add Texture Drawing Method
- Add `drawTexture(texture, x, y, width, height)` method
- Renders texture as a single quad sprite
- Temporarily switches textures during rendering
- Expected outcome: Can draw cached textures efficiently

### Step 4: Add Cleanup Methods
- Add texture and framebuffer disposal methods
- Ensure proper WebGL resource cleanup
- Expected outcome: No memory leaks from cached textures

## Success Criteria

- [ ] Can create render textures without memory leaks
- [ ] Can render existing drawing commands to textures
- [ ] Can draw textures as single quads
- [ ] No breaking changes to existing 2d-engine API
- [ ] Performance improvement when caching is implemented in editor

## Affected Components

- `packages/2d-engine/src/index.ts` - Add new texture rendering methods
- `packages/2d-engine/src/utils/createTexture.ts` - May need updates for render textures
- Future: `packages/editor` - Will use new capabilities for text caching

## Risks & Considerations

- **WebGL Context Loss**: Render textures need recreation if context is lost
- **Memory Usage**: Cached textures consume GPU memory, need proper management
- **Framebuffer Support**: Ensure framebuffer operations work across target browsers
- **Breaking Changes**: None expected - only adding new methods
- **Dependencies**: None - purely additive changes

## Related Items

- **Enables**: Future text caching implementation in editor package
- **Related**: Performance optimization efforts

## References

- [WebGL Framebuffer Tutorial](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)
- [MDN WebGL Framebuffer API](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer)

## Notes

- Keep 2d-engine generic - no code-block or editor-specific logic
- All caching logic should be implemented in editor package later
- This provides the foundation for various caching strategies
- Consider texture size limits and power-of-2 requirements 