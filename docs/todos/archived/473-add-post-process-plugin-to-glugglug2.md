---
title: 'TODO: Add post-process plugin to glugglug2'
priority: Medium
effort: 2-4d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add post-process plugin to glugglug2

## Problem Description

Old `glugglugglug` can pass the completed scene through one fullscreen shader using `u_renderTexture`, `u_time`, and
`u_resolution`. A normal `postDraw` hook can draw above the scene, but it cannot sample the already rendered canvas
unless the scene is first made available as a texture.

Add an optional `PostProcess` plugin that captures the completed default framebuffer on the GPU and draws one active
effect back to the canvas. Keep this feature outside the sprite renderer and pay its capture cost only while an effect
is active.

## Proposed Solution

Add `src/plugins/post-process/` and export `PostProcess`, `PostProcessEffect`, and its options from the package root. The
plugin registers one retained `postDraw` hook and exposes cold `setEffect()`, `clearEffect()`, and `destroy()` methods.

For the MVP, use a plugin-owned texture sized to the current drawing buffer:

```text
all earlier pre/application/post passes draw to the default framebuffer
copy the completed default color buffer into the plugin texture
draw a fullscreen triangle or quad to the default framebuffer with the active effect
```

Use `copyTexSubImage2D()` or an equivalent GPU-side copy; never read pixels into JavaScript. Allocate or resize the
capture texture only when the drawing-buffer dimensions change. If no effect is active, the hook must return before any
copy, allocation, uniform update, or draw.

Provide the old standard shader inputs:

- `u_renderTexture`: captured scene texture.
- `u_time`: seconds elapsed since plugin construction.
- `u_resolution`: drawing-buffer width and height.
- Default vertex-shader varyings for texture coordinates and top-left normalized screen coordinates.

Hook order defines whether another overlay is processed. Construct or place `PostProcess` after `LineDrawer` when lines
should be included in the effect; place later overlays after it when they must remain unaffected.

## Anti-Patterns

- Do not use `readPixels()`, a 2D canvas, `ImageData`, or CPU round-tripping.
- Do not capture or draw when no effect is active.
- Do not add post-process branches, samplers, or framebuffer resources to the sprite shader.
- Do not assume post-process is always the final hook; document array ordering explicitly.
- Do not compile shaders or recreate fullscreen geometry every frame.
- Do not silently retain a failed replacement over a working effect.
- Do not introduce a general render graph or multi-pass effect chain in the MVP.

## Implementation Plan

### Step 1: Define the effect and lifecycle API

- Add a self-contained `plugins/post-process/` folder and root exports.
- Implement atomic effect replacement, clear, and independent idempotent destruction.
- Register one stable post-draw callback and document its ordering relative to overlay plugins.

### Step 2: Capture and process the completed frame

- Lazily create a capture texture with clamp-to-edge sampling and resize it only after canvas size changes.
- Copy the default framebuffer into the texture entirely on the GPU.
- Establish the fullscreen pass state, bind the capture texture, set standard uniforms, and draw the effect.
- Verify top-left coordinate and texture orientation with asymmetric content.

### Step 3: Add regression and performance coverage

- Test no-effect fast exit, copy/draw ordering, resizing, replacement failures, uniforms, hook order, and cleanup.
- Extend the Chromium fixture with a deterministic effect that visibly transforms underlay, sprites, and optionally lines.
- Measure the active full-frame copy. If it is materially expensive, record a follow-up for a shared offscreen scene
  target rather than silently expanding this task.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- `npx nx run glugglug2:test:screenshot`

## Success Criteria

- [x] One active effect can process the complete framebuffer without CPU pixel readback.
- [x] Inactive frames perform no capture, allocation, or post-process draw.
- [x] `u_renderTexture`, `u_time`, `u_resolution`, and default varyings match the documented contract.
- [x] Hook ordering can include or exclude line and other overlay plugins predictably.
- [x] Capture storage follows drawing-buffer resize without per-frame reallocation.
- [x] Shader replacement is atomic and plugin cleanup is independent and idempotent.
- [x] Unit and visual tests cover lifecycle, orientation, resize, and whole-scene processing.

## Affected Components

- `packages/editor/packages/glugglug2/src/plugins/post-process/` - Plugin, capture resources, shaders, and tests.
- `packages/editor/packages/glugglug2/src/index.ts` - Root exports.
- `packages/editor/packages/glugglug2/screenshot-tests/` - Whole-scene effect coverage.
- `packages/editor/packages/glugglug2/README.md` - Effect contract, ordering, and performance notes.

## Risks & Considerations

- **Full-frame copy**: GPU copying is simpler than redirecting every renderer plugin, but it has bandwidth cost while
  active. Profile before replacing it with a more invasive render-target contract.
- **Orientation**: Default framebuffer and sampled texture coordinates can invert vertically; use asymmetric tests.
- **Hook ordering**: A later post hook is not included in the captured scene by design.
- **Resize**: A zero-sized or context-lost drawing buffer is programmer/platform state with unspecified render results.

## Related Items

- **Depends on**: TODO 471 (raw WebGL hooks; completed)
- **Related**: TODO 472 (shader underlay plugin)
- **Related**: TODO 170 (toggle post-process effects)
- **Related**: TODO 179 (shader error reporting)
- **Related**: TODO 211 (WASM-backed shader uniforms; completed)

## Notes

- The GPU-copy MVP preserves the small hook system and includes any pass already drawn to the default framebuffer.
- A future direct offscreen scene target would need coordination across clear, underlay, sprite, line, and post-process
  boundaries and should be designed explicitly if profiling justifies it.
- Completed with an exported `PostProcess`. Its inactive hook exits before allocation or GPU calls; an active hook uses
  one `copyTexSubImage2D()` framebuffer-to-texture copy and one fullscreen draw with required `u_renderTexture` plus
  optional `u_time` and `u_resolution` uniforms.
- The engine requests an opaque default framebuffer, so capture storage uses matching `RGB8`/`RGB` data. Chrome reports
  `INVALID_OPERATION` for the otherwise equivalent copy into RGBA8 storage. Capture storage is allocated lazily and
  replaced only when drawing-buffer dimensions change.
- A local headless Chrome/M1 Pro timing probe produced no stable signal above timer resolution at the 160x96 fixture
  size. The deterministic cost contract is therefore recorded structurally as one full-frame GPU copy plus one quad
  draw per active frame; a representative application benchmark should precede any offscreen-scene redesign.
- The Chromium fixture constructs this plugin after `LineDrawer`, proving that the shader processes underlays, sprites,
  and lines together without vertical inversion or CPU readback.

## Archive Instructions

When completed, move this file to `docs/todos/archived/`, add its completion entry to `docs/todos/_index.md`, and record
the final shader interface, capture strategy, measured copy cost, hook-order behavior, and visual coverage.
