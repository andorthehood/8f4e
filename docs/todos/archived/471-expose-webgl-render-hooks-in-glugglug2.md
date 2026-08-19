---
title: 'TODO: Expose raw WebGL render hooks in glugglug2'
priority: Medium
effort: 1-2d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Expose raw WebGL render hooks in glugglug2

## Problem Description

`glugglug2` currently owns a private `WebGL2RenderingContext` and one sprite pass. Consumers cannot add a shader
underlay, a separately buffered line overlay, or another custom WebGL pass without modifying the renderer. A formal
plugin lifecycle would add registration, ownership, and state-isolation machinery before those needs have demonstrated
that complexity is necessary.

Expose the shared WebGL2 context and two simple ordered hook arrays instead. Trusted consumers can then perform arbitrary
WebGL work below or above the sprite layer while the sprite submission hot path remains unchanged.

Because hooks deliberately receive unrestricted access to the same context, they may leave bindings and capabilities in
any state. `glugglug2` must defensively reassert the state required to clear the next frame and render its sprite pass.
The implementation must contain comments explaining that this apparently redundant setup protects the engine from
shared-context hook mutations and must not be removed as routine cleanup.

## Proposed Solution

Expose the raw context and mutable hook arrays on `Engine`:

```ts
export type RenderHook = (gl: WebGL2RenderingContext) => void;

export type RenderHooks = {
	readonly preDraw: RenderHook[];
	readonly postDraw: RenderHook[];
};

class Engine {
	readonly gl: WebGL2RenderingContext;
	readonly hooks: RenderHooks = {
		preDraw: [],
		postDraw: [],
	};
}
```

Do not add registration or removal methods. Consumers can push, splice, and order callbacks directly. Hook arrays are
iterated in array order without validation, copying, sorting, or dependency resolution.

Define one precise frame sequence:

```text
reset the sprite instance buffer
restore clear state and clear the default framebuffer
run preDraw hooks
run the application draw callback
restore sprite-pass WebGL state and flush sprites
run postDraw hooks
```

- `preDraw` runs after the canvas has been cleared and before the application callback. Shader underlays can draw here,
  while a line renderer can reset its CPU write cursor before the application submits new lines.
- The application callback may submit sprites, append data to external renderers, or use `engine.gl` directly.
- `postDraw` runs after the sprite flush, including frames with zero sprites. A line renderer can upload and draw its
  overlay here.
- Hook errors propagate normally. Later hooks and rendering phases do not run after an error.
- Mutating a hook array while that array is being iterated is a programmer error with unspecified consequences.

Example usage:

```ts
const background = new ShaderUnderlay(engine.gl);
const lines = new LineDrawer(engine);

engine.hooks.preDraw.push(() => background.draw());

engine.renderFrame(() => {
	engine.drawSprite(20, 20, spriteId);
	lines.drawLine(0, 0, 100, 100, 2, [1, 1, 1, 1]);
});
```

External objects own and delete every resource they create. `Engine.destroy()` continues to delete only engine-owned
resources.

### Defensive state boundary

At the beginning of every frame, before clearing, restore at least the default framebuffer, canvas viewport, full color
mask, disabled scissor test, and configured clear color. A previous `postDraw` hook must not be able to redirect or clip
the next clear.

Immediately before the sprite draw, restore every state the sprite renderer relies on, including:

- Default framebuffer and canvas viewport.
- Sprite program, vertex array, and instance buffer.
- Atlas and lookup texture units and bindings.
- Enabled blending with `FUNC_ADD` and premultiplied-alpha `ONE, ONE_MINUS_SRC_ALPHA` factors.
- Full color mask.
- Disabled scissor, depth, stencil, face-culling, and rasterizer-discard capabilities.

This is not a complete WebGL sandbox. Hooks are trusted and can still delete discovered engine resources, lose the
context, clear the canvas, or deliberately break rendering. The defensive boundary only guarantees that ordinary state
changes made by a custom pass do not accidentally corrupt the following sprite pass or frame clear.

## Anti-Patterns

- Do not build attach/detach, dependency ordering, capability negotiation, plugin identifiers, or lifecycle management.
- Do not hide the context behind a restricted façade; this task intentionally exposes `WebGL2RenderingContext`.
- Do not snapshot and restore the entire WebGL state around every hook.
- Do not run hooks from `drawSprite()` or add hook checks to the per-sprite hot path.
- Do not copy or sort hook arrays each frame.
- Do not let the core engine destroy buffers, programs, textures, or framebuffers created by hook consumers.
- Do not expose engine-owned atlas textures, lookup textures, programs, VAOs, or CPU instance storage directly.
- Do not add line rendering to `Engine`; the exported `LineDrawer` remains an independently owned hook consumer.
- Do not add general shader compilation helpers, post-processing, or raster caching in this task.
- Do not describe hooks as sandboxed or safe for untrusted code.
- Do not remove the defensive state restoration or its explanatory comments merely because the engine already set the
  same values during construction.

## Implementation Plan

### Step 1: Expose the context and hooks

- Expose the renderer's existing WebGL2 context as `Engine.gl` without requesting a second canvas context.
- Export `RenderHook` and `RenderHooks` from the root package entry point.
- Add public, retained `preDraw` and `postDraw` arrays under `engine.hooks`.
- Add JSDoc to the new public types and fields explaining ordering, trust, resource ownership, and mutation behavior.

### Step 2: Integrate hooks into frame orchestration

- Run `preDraw` after clear and before the application callback.
- Run `postDraw` after the sprite flush even when the sprite instance count is zero.
- Preserve registration order within each hook array.
- Keep the frame marked open while hooks execute so existing cold-path restrictions remain active.
- Preserve current continuous-render-loop error behavior when a hook throws.

### Step 3: Add defensive WebGL state restoration

- Restore the default clear target, viewport, color mask, scissor state, and clear color in `beginFrame()`.
- Extract or centralize a sprite-pass state preparation method called immediately before upload/draw.
- Restore all bindings and capabilities required by the sprite pass rather than assuming hooks preserved them.
- Add prominent comments beside both restoration boundaries explaining that raw shared-context hooks can dirty state and
  that the repeated assignments are intentional correctness work.

### Step 4: Add automated coverage

- Extend the fake WebGL context with the bindings and capabilities needed to verify restoration.
- Test `Engine.gl` is the same context used by the renderer.
- Test exact pre-hook, application-callback, sprite-flush, and post-hook ordering.
- Test multiple hooks run in registration order and post hooks run on zero-sprite frames.
- Test hook errors propagate and leave the engine able to close its frame state correctly.
- Test a pre hook can dirty framebuffer, viewport, blending, color mask, scissor, depth, stencil, culling, and rasterizer
  state without corrupting the subsequent sprite pass.
- Test a post hook can dirty clear-related state without corrupting the next frame's clear.
- Extend the visual fixture with a simple raw-WebGL underlay and overlay around sprites to lock down layer order.

### Step 5: Document trusted extension usage

- Add a concise raw-context and hook example to the README.
- Document hook timing, ordering, error propagation, and manual resource cleanup.
- Warn that external code is trusted and can intentionally corrupt or destroy engine rendering.
- State that built-in shader helpers can be added later as ordinary hook consumers without expanding this API.

### Step 6: Add an example line plugin

- Export a separately owned `LineDrawer` built only on `RenderPluginHost.gl` and its hook arrays.
- Reset reusable CPU line storage from `preDraw` and upload/draw it once from `postDraw`.
- Store endpoints, thickness, and packed normalized RGBA per line without using the sprite atlas.
- Draw every line above sprites in call order with one instanced triangle-strip pass.
- Keep line submission unchecked and require callers to destroy the plugin's GPU resources explicitly.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- `npx nx run glugglug2:test:screenshot`
- Inspect the engine and renderer source and confirm explanatory comments remain beside both defensive state boundaries.
- Confirm no hook checks or context access were added to `InstanceBuffer.append()` or the per-sprite submission path.

## Success Criteria

- [x] `Engine.gl` exposes the exact WebGL2 context used by the sprite renderer.
- [x] `engine.hooks.preDraw` and `engine.hooks.postDraw` are public ordered callback arrays.
- [x] Pre hooks run after clear and before the application callback.
- [x] Post hooks run after sprites and also run when no sprites were submitted.
- [x] Sprite submission still performs no plugin or hook work.
- [x] The next clear and sprite pass restore the WebGL state they require after arbitrary ordinary hook mutations.
- [x] Source comments explain why defensive state restoration is required for the shared raw context and warn against
      removing it as redundant.
- [x] Hook-created resources remain owned and cleaned up by the external consumer.
- [x] Hook errors and in-loop array mutation follow the documented programmer-error behavior.
- [x] `LineDrawer` demonstrates a separately buffered, single-draw overlay plugin exported from the package root.
- [x] Unit and visual regression tests cover hook order and underlay/sprite/overlay layering.
- [x] Package build, typecheck, tests, lint, and screenshot tests pass.

## Affected Components

- `packages/editor/packages/glugglug2/src/engine.ts` - Public context, hook arrays, and frame-phase orchestration.
- `packages/editor/packages/glugglug2/src/renderer.ts` - Context exposure and defensive clear/sprite state preparation.
- `packages/editor/packages/glugglug2/src/types.ts` - Public hook contracts.
- `packages/editor/packages/glugglug2/src/index.ts` - Root type exports.
- `packages/editor/packages/glugglug2/src/plugins/` - Exported line-overlay plugin, shaders, compact buffer, and tests.
- `packages/editor/packages/glugglug2/src/engine.test.ts` - Hook order, errors, zero-sprite behavior, and context identity.
- `packages/editor/packages/glugglug2/screenshot-tests/` - Underlay/sprite/overlay visual ordering.
- `packages/editor/packages/glugglug2/README.md` - Trusted raw-context extension documentation.

## Risks & Considerations

- **Unrestricted access**: Consumers can intentionally clear the canvas, delete engine resources discovered through GL
  state queries, or lose the context. This is accepted because hooks are trusted programmer code.
- **State completeness**: Missing one required restoration can produce subtle cross-pass bugs. Unit and visual tests
  should dirty representative state deliberately.
- **Resource leaks**: The engine cannot identify external resources. Consumers must dispose their own extensions before
  or alongside `Engine.destroy()`.
- **Hook-array mutation**: Public arrays are simple but permit mutation during iteration. Treat such mutation as a
  programmer error instead of copying arrays every frame.
- **Post-processing**: A post hook draws above sprites on the default framebuffer; it is not equivalent to an offscreen
  whole-scene post-processing pipeline.
- **Breaking changes**: None expected for existing consumers; new state restoration may reveal external code that was
  accidentally relying on stale renderer state.

## Related Items

- **Related**: TODO 468 (Add shader-batched raster caches to glugglug2; remains a core renderer feature)
- **Related**: TODO 470 (Add no-op cacheGroup compatibility helper to glugglug2 utilities)
- **Related**: TODO 469 (Add optional drawing utilities to glugglug2; completed)
- **Related**: `packages/editor/packages/glugglug2/docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md`

## Notes

- The hook API is intentionally smaller and more permissive than a plugin system. A stricter abstraction should be added
  only after concrete extensions demonstrate a need for lifecycle or coordination machinery.
- `LineDrawer` is the first example plugin: it resets a reusable CPU cursor in `preDraw`, packs each line into 24 bytes,
  and uploads/draws all lines once in `postDraw`. Its `destroy()` method unregisters its hooks and deletes only its own
  program, vertex array, and buffer.
- The final frame order is clear/reset, ordered pre hooks, application submission, defensive sprite-state restoration,
  sprite flush, then ordered post hooks. Post hooks run even when the sprite buffer is empty.
- The clear boundary restores the default framebuffer, canvas viewport, full color mask, disabled scissor test, and
  black clear color. The sprite boundary additionally restores its program, VAO, buffer, textures, sampler uniforms,
  premultiplied-alpha blending, and disables depth, stencil, culling, and rasterizer discard.
- The visual snapshot contains a raw-WebGL scissored underlay, normal atlas sprites, and crossed line-plugin overlays.
- A future shader underlay can draw a fullscreen triangle from `preDraw` after the engine has cleared the canvas.

## Archive Instructions

Completed on 2026-08-19. The final hook names, exact frame order, restored state list, example line plugin, and visual
coverage are recorded above.
