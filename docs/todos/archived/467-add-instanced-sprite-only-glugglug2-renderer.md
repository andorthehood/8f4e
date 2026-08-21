---
title: 'TODO: Add instanced sprite-only glugglug2 renderer'
priority: Medium
effort: 2-4d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add instanced sprite-only glugglug2 renderer

## Problem Description

The existing glugglugglug renderer expands 2D rectangles and sprites into repeated triangle vertex and texture-coordinate data on the CPU. Most editor rendering consists of textured rectangles, so this sends redundant rectangle geometry to GPU memory every frame.

Create a new `glugglug2` package next to glugglugglug. It should keep glugglugglug's convenient immediate-mode render cycle, but it does not need API or implementation compatibility. The MVP is deliberately limited to drawing sprites from one atlas; caching, lines, and other primitives are out of scope.

## Proposed Solution

Build a WebGL2 sprite renderer around one persistent sprite atlas and one compact instanced draw list.

Representative usage:

```ts
const engine = new Engine(canvas);

engine.setSpriteAtlas(image, spriteMap);

engine.render(() => {
	engine.drawSprite(x, y, spriteId, width, height);
	engine.drawSprite(otherX, otherY, otherSpriteId);
});
```

The public API should retain glugglugglug's sprite argument order:

```ts
drawSprite(x: number, y: number, sprite: string | number, width?: number, height?: number): void;
```

When width or height is omitted, resolve it from that sprite's source dimensions in the atlas lookup. The resolved destination width and height are still written into every GPU instance.

### Atlas lifecycle

- Upload the atlas image and sprite lookup atomically through `setSpriteAtlas(image, spriteMap)` so they cannot temporarily become mismatched.
- Accept `string | number` sprite identifiers in the public lookup and `drawSprite()` API.
- Convert public identifiers to dense numeric GPU ids when setting the atlas.
- Upload a GPU lookup table that maps each dense id to its atlas texture coordinates.
- Keep the atlas and lookup table unchanged during normal render cycles.
- Replace them only through another explicit atlas call, such as when changing fonts.
- Use nearest-neighbor texture filtering for pixelated rendering.

The public lookup should retain glugglugglug's existing shape:

```ts
type SpriteCoordinates = {
	x: number;
	y: number;
	spriteWidth: number;
	spriteHeight: number;
};

type SpriteLookup = Record<string | number, SpriteCoordinates>;
```

### Instance layout

Each `drawSprite()` call appends one 20-byte instance record:

| Field | Type | Bytes |
| --- | --- | ---: |
| `x` | `float32` | 4 |
| `y` | `float32` | 4 |
| `width` | `float32` | 4 |
| `height` | `float32` | 4 |
| dense internal sprite id | `uint32` | 4 |

The append order is the sprite drawing order. Do not sort or regroup instances in a way that changes blending order. Public string or number identifiers are resolved on the CPU before the internal numeric id is appended.

### Render cycle

Expose both render entry points:

- `render(callback)` owns a continuous `requestAnimationFrame` loop.
- `renderFrame(callback)` renders one synchronous frame without scheduling another.

For each frame rendered by either entry point:

1. Reset the instance count and CPU write cursor without zero-filling memory.
2. Reuse the existing CPU typed array while `drawSprite()` appends instance records.
3. Upload only the used portion of the array to the existing GPU instance buffer once.
4. Issue one instanced draw call for all appended sprites.

Reuse CPU and GPU allocations between frames. If capacity is exceeded, grow the buffers and reuse the larger allocations on later frames. Generate rectangle corners in the vertex shader from `gl_VertexID`, or use one shared static unit quad, so rectangle triangle coordinates are not repeated per instance.

Enable standard alpha blending and preserve call order. If line rendering is introduced separately, it may use its own buffer and render as an overlay after all sprites.

### Canvas behavior

- Use canvas pixel coordinates with the origin at the top-left and positive Y pointing downward.
- Expose explicit `resize(width, height)` behavior; the caller owns CSS sizing and device-pixel-ratio calculations.
- Request an opaque WebGL2 canvas, clear it to black at the start of every frame, and use premultiplied-alpha blending.
- Keep `drawSprite()` unchecked: callers are responsible for using identifiers from the active atlas and finite rectangle values.

### Resource lifecycle

Expose an idempotent `destroy()` that cancels the engine's active animation-frame request and releases the atlas texture, lookup texture, instance buffer, vertex array, and shader program. Calls that require a live engine should throw after destruction. Automatic WebGL context-loss restoration is outside the MVP.

## Anti-Patterns

- Do not allocate a new CPU array or GPU buffer every render cycle.
- Do not clear instance storage by filling it with zeroes; reset the used count only.
- Do not upload the atlas or sprite lookup table every frame.
- Do not generate six rectangle vertices and repeated texture coordinates for every sprite.
- Do not issue one draw call per sprite.
- Do not add caching, line drawing, general primitive drawing, or glugglugglug compatibility to the MVP.
- Do not reorder sprites for texture batching; the single-atlas design already permits one draw call.
- Do not add identifier, lifecycle, or numeric-value validation to the per-sprite hot path.
- Do not automatically infer CSS or device-pixel-ratio canvas sizing.
- Do not add automatic WebGL context-loss restoration to the MVP.

## Implementation Plan

### Step 1: Create the package and public API

- Add the `glugglug2` package next to `packages/editor/packages/glugglugglug` and register its Nx build, test, typecheck, and lint targets consistently with neighboring packages.
- Expose engine creation, atomic atlas replacement, `render()`, `renderFrame()`, `resize()`, `destroy()`, and `drawSprite(x, y, sprite, width?, height?)`.
- Keep the package independent from glugglugglug internals unless a small generic utility is clearly reusable.

### Step 2: Implement persistent atlas resources

- Upload one atlas texture with nearest-neighbor filtering through an atomic image-and-lookup API.
- Convert public `string | number` sprite identifiers to dense internal ids.
- Encode and upload dense-id-to-texture-coordinate lookup data.
- Replace atlas resources only through the explicit atlas API.
- Define clear ownership and cleanup for WebGL resources.

### Step 3: Implement the reusable instance buffer

- Store instances with the 20-byte layout documented above.
- Reset only the write cursor and count at the start of a render cycle.
- Grow CPU and GPU capacity when required and otherwise reuse allocations.
- Upload the used instance range once per render cycle.

### Step 4: Implement instanced rendering

- Expand each instance into a rectangle in the vertex shader or from a shared static unit quad.
- Resolve public sprite identifiers to internal ids and atlas texture coordinates.
- Draw the ordered instance list with one instanced draw call and standard alpha blending.
- Match glugglugglug's top-left, Y-down pixel coordinate system, opaque black clearing, and premultiplied-alpha blending.
- Handle explicit canvas dimensions and resize-related uniforms without replacing the atlas.
- Keep atlas and lifecycle validation on cold operations rather than the per-sprite hot path.

### Step 5: Implement resource cleanup

- Add idempotent `destroy()`, cancel the active animation-frame request, and delete every WebGL resource owned by the engine.
- Throw a clear lifecycle error when a rendering or resource API is used after destruction.
- Leave automatic WebGL context-loss restoration outside the MVP.

### Step 6: Add focused tests and an example

- Test instance packing, cursor reset, capacity growth, and used-range uploads.
- Test string and number identifier encoding, default destination sizes, and atomic atlas replacement.
- Test continuous `render()` and synchronous `renderFrame()` behavior.
- Test explicit resize and resource cleanup.
- Verify that overlapping translucent sprites preserve call order.
- Turn the root `sprite-instancing-poc.html` experiment into, or replace it with, an appropriate package example once the API is implemented.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- Manually verify top-left pixel coordinates, pixelated atlas sampling, explicit resizing, opaque black clearing, premultiplied-alpha blending, and sprite order in a browser.
- Profile a render cycle and confirm one instance-buffer upload, no atlas upload, and one instanced draw call.

## Success Criteria

- [x] `glugglug2` renders sprites from one explicitly uploaded atlas onto a canvas.
- [x] `setSpriteAtlas()` atomically replaces the atlas image and public `string | number` sprite lookup.
- [x] `drawSprite(x, y, sprite, width?, height?)` resolves omitted dimensions from the atlas and appends one 20-byte instance.
- [x] `drawSprite()` omits per-sprite lifecycle, identifier, and numeric-value validation.
- [x] `render()` provides a continuous animation loop and `renderFrame()` renders one synchronous frame.
- [x] Each render cycle reuses allocations, resets the write cursor, and uploads only the used instance range once.
- [x] All sprites are rendered with one instanced draw call.
- [x] Sprite call order is preserved for alpha blending.
- [x] Rectangle triangle coordinates and texture coordinates are not duplicated in every instance.
- [x] Atlas replacement is explicit and normal rendering does not reupload atlas resources.
- [x] Rendering uses top-left, Y-down pixel coordinates, explicit resizing, an opaque black canvas, and premultiplied-alpha blending.
- [x] `destroy()` is idempotent, stops the continuous render loop, and releases all WebGL resources owned by the engine.
- [x] Package tests, build, typecheck, and lint pass.
- [x] The MVP contains no caching, lines, or other primitive rendering.

## Affected Components

- `packages/editor/packages/glugglug2/` - new sprite-only renderer package.
- `nx.json` and package project configuration - workspace registration as needed.
- `sprite-instancing-poc.html` - existing proof of concept to retain as a reference or migrate into an example.

## Risks & Considerations

- **Instance stride**: The straightforward layout uses 20 bytes per sprite. More compact integer packing is intentionally deferred until profiling proves it worthwhile.
- **Buffer growth**: Growing while rendering can cause an allocation spike; use a predictable capacity-growth strategy and retain the new allocation.
- **Lookup representation**: Select a WebGL2-compatible lookup representation that preserves exact sprite ids and texture coordinates across supported browsers.
- **Transparency**: Any future batching or multiple-atlas work must not silently change sprite order.
- **Public identifier lookup**: String identifiers add a CPU lookup to `drawSprite()`; keep the GPU instance compact by resolving them to dense numeric ids before writing.
- **Unchecked hot path**: Invalid sprite identifiers or rectangle values are programmer errors with unspecified results; validate inputs before entering the render loop when needed.
- **Context loss**: Automatic restoration is explicitly outside the MVP. A lost context requires the caller to recreate the engine and explicitly set its atlas again.
- **Breaking changes**: None for glugglugglug because this is a separate, intentionally incompatible package.

## Related Items

- **Related**: `packages/editor/packages/glugglugglug/`
- **Related**: TODO 048 (Add 2D Engine Visual Regression Tests)
- **Related**: TODO 052 (Simplify Cache Rendering Order)

## Notes

- The package is named `glugglug2`; its immediate-mode data flow and documented public API are explicit design decisions.
- The public draw signature intentionally follows glugglugglug's `x, y, sprite, width?, height?` order even though the package is otherwise free to break compatibility.
- Per-frame instance upload is expected because the caller rebuilds the ordered draw list every render cycle. The optimization is to upload only position, size, and the resolved numeric sprite id instead of expanded triangle geometry.
- Per-sprite lifecycle, identifier, and finite-number validation was removed from `drawSprite()` after the initial implementation to keep the hot path minimal.
- A future line renderer may use a separate buffer and render after the sprite layer, but it is not part of this TODO's MVP.
- Completed with 13 focused unit tests and a browser example verified in Chrome/WebGL2 with no console or WebGL errors.
