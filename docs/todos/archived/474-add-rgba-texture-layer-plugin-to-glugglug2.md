---
title: 'TODO: Add RGBA texture layer plugin to glugglug2'
priority: Medium
effort: 2-4d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add RGBA texture layer plugin to glugglug2

## Problem Description

Old `glugglug` can upload or update caller-owned RGBA8 pixels, choose nearest or linear filtering, draw that texture,
and delete it. The editor uses this for a WebAssembly-produced framebuffer. `glugglug2` only samples its persistent
sprite atlas, so consumers cannot currently display dynamic pixel buffers without writing raw texture lifecycle and
fullscreen rectangle code themselves.

Add an optional RGBA texture layer plugin. Following the current layer policy, external textures occupy one fixed
underlay or overlay layer; only sprite-to-sprite order remains part of the main ordered instance buffer.

## Proposed Solution

Add `src/plugins/rgba-texture-layer/` and export the plugin plus opaque texture-handle and filter types. The plugin owns
uploaded textures, reusable rectangle geometry, a small texture shader, and one selected `preDraw` or `postDraw` hook.

The public surface should cover:

- Create a texture from `Uint8Array` or `Uint8ClampedArray` RGBA8 pixels.
- Update an existing same-sized texture with `texSubImage2D()` without allocating a new GPU texture.
- Explicitly replace storage when dimensions change.
- Select `nearest` or `linear` filtering on the cold create/update path.
- Draw a texture rectangle with position, size, and alpha within the plugin's fixed layer.
- Delete one texture explicitly and destroy all plugin-owned resources idempotently.

Because an underlay hook runs before the application sprite callback, define an explicit per-layer draw callback or
retained placement API that lets the plugin receive current texture updates and draw instructions during its own hook.
Do not pretend ordinary `drawTexture()` calls made later in the application callback can be retroactively inserted into
an earlier layer.

Representative shape:

```ts
const frames = new RgbaTextureLayer(engine, { phase: 'preDraw' });

frames.setDrawCallback(layer => {
	frame = layer.uploadRgba8Texture(pixels, width, height, { texture: frame, filter: 'nearest' });
	layer.drawTexture(frame, x, y, drawWidth, drawHeight);
});
```

The exact callback/retained API may be refined, but phase and ordering semantics must remain explicit.

## Anti-Patterns

- Do not add arbitrary-texture handles to the sprite identifier type without a unified source-encoding design.
- Do not claim arbitrary interleaving with sprite calls; the MVP is one fixed underlay or overlay layer.
- Do not allocate a new texture for every same-sized pixel update.
- Do not read pixels back to the CPU or route them through a temporary 2D canvas.
- Do not upload unchanged pixels automatically or add hashing/change detection.
- Do not make the core engine destroy plugin-owned textures.
- Do not combine this layer with raster-cache allocation; TODO 468 owns cached sprite composites.

## Implementation Plan

### Step 1: Define texture ownership and layer timing

- Add a self-contained `plugins/rgba-texture-layer/` folder and root exports.
- Define opaque handles, filters, update options, draw callback or retained placement, and deletion behavior with JSDoc.
- Register one stable hook for the configured phase and document ordering relative to shader, sprite, line, and
  post-process passes.

### Step 2: Implement uploads and rectangle rendering

- Create RGBA8 textures with clamp-to-edge wrapping and explicit nearest/linear filtering.
- Reuse texture objects and storage for same-sized updates through `texSubImage2D()`.
- Render top-left, Y-down destination rectangles with premultiplied-alpha-compatible blending and caller alpha.
- Establish all GL state used by the layer without relying on bindings left by another plugin.

### Step 3: Add web-ui-oriented coverage

- Test create, same-size update, dimension replacement, filter changes, draw geometry, alpha, deletion, and destroy.
- Add a visual fixture with an asymmetric generated pixel buffer below sprites and optionally another instance above them.
- Document how the WebAssembly framebuffer drawer supplies fresh memory during the plugin hook.
- Record a separate follow-up if a demonstrated use case requires arbitrary texture/sprite interleaving.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- `npx nx run glugglug2:test:screenshot`

## Success Criteria

- [x] Callers can create, update, draw, delete, and replace RGBA8 textures through an exported plugin.
- [x] Same-sized updates retain the GPU texture and use `texSubImage2D()`.
- [x] Nearest and linear filtering are explicit and visually covered.
- [x] Layer phase is fixed and documented; texture draws do not disturb sprite submission order.
- [x] Positions use top-left, Y-down coordinates and alpha follows premultiplied blending semantics.
- [x] Plugin and individual texture cleanup are independent and idempotent.
- [x] Unit and visual tests cover pixel orientation, filtering, updates, layering, and lifecycle.

## Affected Components

- `packages/editor/packages/glugglug2/src/plugins/rgba-texture-layer/` - Texture lifecycle, layer renderer, and tests.
- `packages/editor/packages/glugglug2/src/index.ts` - Root exports.
- `packages/editor/packages/glugglug2/screenshot-tests/` - Pixel orientation, filtering, and layer coverage.
- `packages/editor/packages/glugglug2/README.md` - Texture API, phase semantics, and ownership.
- `packages/editor/packages/web-ui/src/drawers/wasmFrameTexture.ts` - Future migration consumer.

## Risks & Considerations

- **Layer limitation**: Fixed phase is intentionally weaker than old arbitrary command ordering. If that becomes
  insufficient, design shared source encoding or segmented replay separately rather than hiding extra draws.
- **Upload bandwidth**: Dynamic framebuffers still upload every changed pixel each frame; reuse avoids allocation but not
  transfer cost.
- **Filtering**: Linear sampling must not affect sprite-atlas nearest-neighbor behavior because resources are separate.
- **Memory ownership**: Texture handles become invalid after individual deletion or plugin destruction; use afterward is
  a programmer error with unspecified consequences.

## Related Items

- **Depends on**: TODO 471 (raw WebGL hooks; completed)
- **Related**: TODO 468 (shader-batched raster caches)
- **Related**: TODO 472 (shader underlay plugin)
- **Related**: TODO 473 (post-process plugin)
- **Consumer**: `packages/editor/packages/web-ui/src/drawers/wasmFrameTexture.ts`

## Notes

- The plugin replaces old RGBA texture features at the capability level; it does not add old method names to `Engine`.
- The earlier project decision permits non-sprite features to occupy fixed layers. Main sprite ordering remains unchanged.
- Completed with exported `RgbaTextureLayer`, texture/filter/upload types, `uploadRgba8Texture()`, `drawTexture()`,
  `setDrawCallback()`, `deleteTexture()`, and `destroy()`. Uploads are the validated cold path; rectangle draws remain
  unchecked. Same-size updates use `texSubImage2D()`, while size changes replace storage on the same WebGL texture.
- The constructor fixes the layer to `preDraw` or `postDraw`. The callback lets a WebAssembly framebuffer consumer
  expose its current `Uint8Array` view, update the retained texture, and draw it during that fixed phase; migrating the
  current web-ui consumer is intentionally separate from this capability plugin.
- The Chromium fixture uses asymmetric nearest and linear samples below sprites, then verifies their composition with
  the shader underlay, line overlay, and final post-process pass.

## Archive Instructions

When completed, move this file to `docs/todos/archived/`, add its completion entry to `docs/todos/_index.md`, and record
the final texture API, update behavior, layer policy, WebAssembly consumer migration, and visual coverage.
