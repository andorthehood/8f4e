---
title: 'TODO: Add shader-batched raster caches to glugglugglug'
priority: Medium
effort: 3-5d
created: 2026-08-19
issue: null
status: Open
completed: null
---

# TODO: Add shader-batched raster caches to glugglugglug

## Problem Description

`glugglugglug` rebuilds an ordered sprite-instance list every frame. This is appropriate for moving sprites, but static,
dense content such as a long text block may submit hundreds of identical glyph sprites on every render cycle. A
500-glyph label currently requires 500 `drawSprite()` calls, 500 instance records, and 500 instanced quads each frame
even when only the label's outer position changes.

Add an explicit raster-cache facility that renders a group of sprite instructions once into a GPU texture and then
represents the finished image as one rectangle in later frames. Cached images must remain compatible with the existing
ordered instance buffer so interleaving ordinary sprites and cached content does not require sorting, segmented replay,
or one draw call per cache.

## Proposed Solution

Maintain a second, GPU-resident cache atlas and a cache-rectangle lookup texture. Cache creation renders ordinary atlas
sprites into a rectangle in that cache atlas through a WebGL framebuffer. Drawing the completed cache appends one normal
20-byte instance record containing its destination rectangle and an encoded cache id.

Reserve the high bit of the existing unsigned 32-bit instance id as the texture-source flag:

```ts
const CACHE_FLAG = 0x80000000;
const CACHE_INDEX_MASK = 0x7fffffff;
```

- Ordinary sprites retain dense ids with the high bit clear.
- Cached images use `CACHE_FLAG | cacheIndex`.
- Keep the instance buffer as `Uint32Array` data and the shader attribute as `uint`; do not convert the path to signed
  integers merely to express negative sentinel ids.

The vertex shader should inspect the flag, mask out the dense lookup index, and fetch the source rectangle from either
the sprite lookup or cache lookup. It should pass a `flat` texture-source flag and correctly normalized texture
coordinates to the fragment shader. The fragment shader should branch between two fixed samplers: the persistent sprite
atlas and the persistent cache atlas.

Because every cache shares the cache atlas, both samplers and both lookup textures can be bound before the main draw.
Ordinary and cached rectangles can therefore stay in one instance buffer and one `drawArraysInstanced()` call while
preserving exact call order:

```ts
engine.renderFrame(() => {
	engine.drawSprite(backgroundX, backgroundY, 'background');
	engine.drawCache(cachedText, textX, textY);
	engine.drawSprite(cursorX, cursorY, 'cursor');
});
```

### Representative API

The exact names may be refined during implementation, but the API should remain explicit and retained only for cached
content:

```ts
const cachedText = engine.createCache(800, 160, cache => {
	for (const glyph of glyphs) {
		cache.drawSprite(glyph.x, glyph.y, glyph.sprite, glyph.width, glyph.height);
	}
});

engine.renderFrame(() => {
	engine.drawCache(cachedText, 40, 80);
});
```

The cache builder's `drawSprite(x, y, spriteId, width?, height?)` surface should be structurally compatible with the
`SpriteTarget` contract implemented by TODO 469. This allows `glugglugglug/utils` consumers to wrap a cache builder in a
`DrawContext` for offsets and fixed-cell text without making the core cache implementation import the optional utility
entry point.

- `createCache(width, height, callback)` allocates an atlas rectangle, clears it to transparent, and renders the
  callback's local sprite instructions once.
- `updateCache(handle, callback)` redraws an existing same-sized cache explicitly when its contents change.
- `drawCache(handle, x, y, width?, height?)` appends one encoded instance; omitted dimensions use the cache's pixel size.
- `clearCaches()` invalidates every handle and resets the cache atlas allocator.
- `setSpriteAtlas()` clears all caches because cached pixels and sprite ids came from the previous atlas generation.
- `destroy()` releases the cache atlas, lookup texture, framebuffer, and related CPU metadata with the existing renderer
  resources.

Cache creation and updating are cold paths and should validate dimensions, allocation capacity, framebuffer
completeness, and lifecycle state. `drawCache()` is a hot path and should follow the existing performance-first policy:
stale or foreign handles are programmer errors with unspecified consequences rather than per-call validation work.

### MVP cache allocation

- Use one fixed-size cache atlas configured through engine options and allocated lazily on first use.
- Use a simple deterministic row/shelf allocator.
- Keep cache metadata in a growable CPU array and upload lookup changes only during cache creation, updating, or reset.
- Fail clearly on the cold creation path when the requested rectangle cannot fit.
- Do not add automatic eviction, LRU tracking, hashing, content comparison, or hidden rebuilding.
- Do not allow `drawCache()` inside a cache-building callback. Sampling from the cache atlas while it is attached as the
  active render target would create a WebGL feedback loop. Nested/composed caches can be reconsidered later using a
  scratch texture if a real use case appears.

## Anti-Patterns

- Do not allocate one standalone texture per cached item; WebGL2 cannot turn an arbitrary instance id into an unbounded
  texture handle while retaining one general draw call.
- Do not flush the normal sprite batch whenever a cached item appears; that loses the main ordering-and-batching benefit
  of the encoded-id design.
- Do not use signed negative ids in the public or GPU representation; reserve the high bit of the existing `uint`.
- Do not read cached pixels back to the CPU during creation or normal rendering.
- Do not rerun the cache callback or upload its rasterized pixels every frame.
- Do not infer cache identity by hashing repeated `drawSprite()` calls in the hot path.
- Do not add automatic cache eviction or validation to `drawCache()` in the first implementation.

## Implementation Plan

### Step 1: Define cache handles and encoded ids

- Add an opaque cache-handle type carrying the encoded id and intrinsic pixel dimensions.
- Add shared high-bit flag/mask helpers and focused tests proving that ordinary and cached ids remain exact through the
  `Uint32Array` instance representation.
- Extend engine options with explicit cache-atlas dimensions and document the memory cost as `width × height × 4` bytes.

### Step 2: Add cache-atlas resources and allocation

- Lazily allocate an RGBA cache-atlas texture, framebuffer, cache lookup texture, and CPU lookup metadata.
- Implement a deterministic row/shelf allocator with transparent region clearing and clear failure behavior when full.
- Preserve premultiplied-alpha semantics and nearest-neighbor sampling.
- Handle framebuffer coordinate orientation so cached content is not vertically inverted when sampled later.

### Step 3: Render sprite instructions into cache regions

- Provide a cache-builder callback with the same sprite argument order and unchecked append behavior as `drawSprite()`.
- Keep the cache builder structurally compatible with TODO 469's implemented `SpriteTarget` contract without adding a
  core-to-utils dependency.
- Render the builder's instances into the allocated cache-atlas rectangle using the ordinary sprite atlas as the source.
- Restore framebuffer, viewport, scissor, clear color, texture bindings, and other WebGL state needed by the next canvas
  frame.
- Support explicit same-size cache redraws without allocating or uploading cache pixels every frame.

### Step 4: Select the texture source in the shaders

- Decode the high-bit flag in the vertex shader and fetch from the appropriate rectangle lookup.
- Normalize texture coordinates against the selected atlas dimensions.
- Pass the source selector as a `flat` value and sample one of the two fixed atlas samplers in the fragment shader.
- Bind both atlases and both lookup textures once before the ordered instanced draw.

### Step 5: Integrate cache instances with the render cycle

- Implement `drawCache()` as one append to the existing instance buffer.
- Keep ordinary sprites and caches in submission order and upload the combined used range once per frame.
- Confirm the main canvas frame still uses one instanced draw call regardless of ordinary/cache interleaving.
- Clear caches on sprite-atlas replacement and release all cache resources from `destroy()`.

### Step 6: Add regression and performance coverage

- Add unit tests for id encoding, allocator behavior, lookup updates, reset/invalidation, and resource cleanup.
- Extend the Chromium visual regression fixture with cached text or a dense glyph-like block interleaved between ordinary
  translucent sprites.
- Verify reuse across frames, explicit cache updates, top-left coordinates, alpha blending, and framebuffer orientation.
- Profile a representative 500-sprite text block before and after caching, recording CPU submissions, uploaded instance
  bytes, main-frame draw calls, and cache-atlas memory usage.

## Validation Checkpoints

- `npx nx run glugglugglug:build`
- `npx nx run glugglugglug:typecheck`
- `npx nx run glugglugglug:test`
- `npx nx run glugglugglug:lint`
- `npx nx run glugglugglug:test:screenshot`
- Inspect one cached frame with browser GPU tooling and confirm one main instance-buffer upload and one main instanced draw.
- Confirm cache creation performs its framebuffer render once and later frames only append the single cached-image
  instance.

## Success Criteria

- [ ] Static sprite groups can be rasterized once into a GPU-resident cache atlas and reused explicitly.
- [ ] A cached image occupies one existing 20-byte instance record in normal frames.
- [ ] Ordinary and cached images can be freely interleaved while preserving submission order.
- [ ] The mixed main frame performs one used-range instance upload and one instanced draw call.
- [ ] The high-bit cache flag remains exact through CPU storage and the WebGL integer attribute.
- [ ] Cached content uses nearest-neighbor sampling, premultiplied alpha, and the same top-left coordinate convention as
      ordinary sprites.
- [ ] Cache creation, explicit update, atlas-full failure, full reset, atlas replacement, and engine destruction have
      automated coverage.
- [ ] The cache builder is structurally compatible with TODO 469's implemented `SpriteTarget`, allowing optional drawing
      utilities to target a cache without coupling the core renderer to them.
- [ ] The visual regression suite covers mixed ordinary/cached rendering and framebuffer orientation.
- [ ] The MVP has no hashing, automatic invalidation checks in `drawCache()`, LRU eviction, or nested cache composition.

## Affected Components

- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/engine.ts` - Public cache creation, update, drawing, reset, and lifecycle API.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/renderer.ts` - Cache atlas, framebuffer, allocation, lookup uploads, and render-target
  state.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/instanceBuffer.ts` - Shared encoded-id constants or helpers if appropriate.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/shaders.ts` - Cache-id decoding and dual-atlas sampling.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/types.ts` - Cache options, builder, and opaque handle types.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/screenshot-tests/` - Mixed sprite/cache visual regression coverage.
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/README.md` - Cache API, lifecycle, memory, and invalidation documentation.

## Risks & Considerations

- **Cache-atlas capacity**: A fixed atlas is predictable but finite. Creation must fail on the cold path without corrupting
  existing entries, and callers need a deliberate `clearCaches()` recovery path.
- **Texture bleeding**: Cache regions may need padding even with nearest-neighbor sampling, especially when destination
  scaling is allowed.
- **Framebuffer orientation**: Rendering into a texture can invert Y relative to uploaded image textures; lock behavior
  down with an asymmetric visual fixture.
- **Shader branching**: The texture-source branch is coherent for each rectangle and is expected to be inexpensive, but
  profile mixed workloads rather than assuming it is free.
- **GPU memory**: RGBA cache memory is four bytes per atlas pixel regardless of how much of a cached rectangle is
  transparent. Dense text and UI blocks benefit more than sparse, oversized bounds.
- **Lookup growth**: Cache lookup updates are cold-path work, but allocation and reupload behavior must not leak into the
  per-frame draw path.
- **Invalid handles**: `setSpriteAtlas()` and `clearCaches()` invalidate handles. Using one afterward remains a programmer
  error with unspecified consequences under the package's hot-path policy.
- **WebGL feedback**: Sampling from the active cache-atlas render target is invalid. The MVP must reject cache composition
  during cache creation on the cold path.

## Related Items

- **Depends on**: TODO 467 (Add instanced sprite-only glugglugglug renderer; completed)
- **Related**: TODO 052 (Simplify Cache Rendering Order in glugglugglug)
- **Related**: TODO 155 (Add Framebuffer Memory Accounting in glugglugglug)
- **Related**: TODO 469 (Add optional drawing utilities to glugglugglug; completed)
- **Related**: TODO 470 (Add no-op cacheGroup compatibility helper to glugglugglug utilities)
- **Related**: `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md`

## Notes

- This cache is a raster cache, not merely a retained instance buffer. A dense 500-glyph text block should become one
  textured rectangle in subsequent frames rather than 500 GPU quads.
- The shader does not create or remember the cache. Cache creation rasterizes it once; the main shader only decodes the
  instance id and chooses which already-bound atlas to sample.
- A unified mutable sprite/cache atlas could eliminate the shader branch, but it complicates atlas growth and creates
  sampling/render-target feedback concerns. Keep the original sprite atlas and cache atlas separate for the MVP.

## Archive Instructions

When completed, move this file to `docs/todos/archived/`, add its completion entry to `docs/todos/_index.md`, and record
the implemented cache API, atlas allocation policy, measured 500-sprite comparison, and any differences from the proposed
high-bit shader design.
