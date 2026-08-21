---
title: 'TODO: Add shader underlay plugin to glugglug2'
priority: Medium
effort: 1-2d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add shader underlay plugin to glugglug2

## Problem Description

Old `glugglugglug` can compile one custom background effect and draw it behind the sprite scene. `glugglug2` now exposes
the raw WebGL2 context and ordered `preDraw` hooks, but consumers would still need to repeat shader compilation,
fullscreen geometry, standard uniforms, replacement, and cleanup to use that capability safely.

Ship an optional `ShaderUnderlay` example plugin that owns this repeated work. It should draw after the engine clears the
frame and before sprite submission, without adding shader state or branches to the sprite hot path.

## Proposed Solution

Add `src/plugins/shader-underlay/` and export `ShaderUnderlay`, `ShaderUnderlayEffect`, and its options from the package
root. The plugin registers one retained `preDraw` hook and exposes cold `setEffect()`, `clearEffect()`, and `destroy()`
operations.

```ts
const underlay = new ShaderUnderlay(engine);

underlay.setEffect({
	fragmentShader: backgroundFragmentShader,
});
```

The default vertex shader should cover the canvas and provide the old background-effect contract. A custom vertex
shader may replace it. Before each active draw, set:

- `u_time` to seconds elapsed since plugin construction.
- `u_resolution` to the current WebGL drawing-buffer width and height.

Compile and link replacements atomically: a failed replacement must preserve the previous working effect. The plugin
owns its program, fullscreen geometry, vertex array, hook registration, and timing origin. `Engine.destroy()` must not
delete those resources; callers destroy the plugin independently.

## Anti-Patterns

- Do not compile, link, allocate geometry, or query attribute locations every frame.
- Do not add background-effect methods or uniforms to `Engine` or the sprite renderer.
- Do not draw the underlay from `postDraw`; it must remain below every sprite and overlay plugin.
- Do not snapshot the complete WebGL state. Establish the state the underlay needs and rely on the sprite boundary to
  reassert sprite state afterward.
- Do not swallow shader compiler/linker errors or silently replace a valid effect with a failed one.
- Do not include render-texture sampling or post-processing in this plugin.

## Implementation Plan

### Step 1: Define and export the plugin

- Add a self-contained `plugins/shader-underlay/` folder with an explicit `index.ts`.
- Define the effect contract, standard uniforms, ownership, replacement, and destruction behavior with JSDoc.
- Register one stable pre-draw callback without adding new engine hooks.

### Step 2: Implement fullscreen rendering

- Create reusable fullscreen geometry and a VAO owned by the plugin.
- Provide a default WebGL2 vertex shader compatible with the documented fragment-shader inputs.
- Set viewport, program, VAO, blend/capability state, `u_time`, and `u_resolution` before drawing.
- Make a missing effect a cheap no-op.

### Step 3: Add lifecycle and regression coverage

- Test hook registration order, effect replacement, failed replacement, clear, resize uniforms, and idempotent cleanup.
- Extend the visual fixture with an asymmetric shader background behind sprites and the line overlay.
- Add a concise README example and trusted-plugin ownership warning.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- `npx nx run glugglug2:test:screenshot`

## Success Criteria

- [x] Consumers can set, replace, clear, and destroy one shader underlay.
- [x] The active underlay runs from `preDraw` after clear and below every sprite.
- [x] `u_time` and `u_resolution` match the documented contract and current drawing buffer.
- [x] Effect replacement is atomic when compilation or linking fails.
- [x] No-effect frames allocate nothing and perform no draw call.
- [x] Plugin-created resources remain externally owned and are deleted idempotently.
- [x] Unit and visual tests cover shader lifecycle and underlay/sprite/line layer order.

## Affected Components

- `packages/editor/packages/glugglug2/src/plugins/shader-underlay/` - Plugin, shaders, and focused tests.
- `packages/editor/packages/glugglug2/src/index.ts` - Root exports.
- `packages/editor/packages/glugglug2/screenshot-tests/` - Underlay layer-order coverage.
- `packages/editor/packages/glugglug2/README.md` - Usage and ownership documentation.

## Risks & Considerations

- **Shader contract**: Default varying names and coordinate orientation must be documented and visually locked down.
- **Shared context**: Earlier pre-draw hooks may dirty state; the plugin must establish everything its own draw relies on.
- **Resize**: Resolution comes from the drawing buffer each frame, so explicit engine resize requires no plugin callback.
- **Breaking changes**: None for existing consumers; this is an optional exported plugin.

## Related Items

- **Depends on**: TODO 471 (raw WebGL hooks; completed)
- **Related**: TODO 473 (post-process plugin)
- **Related**: TODO 179 (shader error reporting)
- **Related**: TODO 211 (WASM-backed shader uniforms; completed)

## Notes

- This replaces old `setBackgroundEffect()` behavior at the feature level, not by adding a compatibility method to
  `Engine`.
- Additional application-specific uniforms can be considered separately after the standard time/resolution contract is
  stable.
- Completed with an exported `ShaderUnderlay` whose optional custom vertex shader defaults to a fullscreen contract
  exposing `v_screenCoord`, `v_textureCoord`, and top-left-origin `v_topLeftScreenCoord`. Optional `u_time` and
  `u_resolution` uniforms are resolved once per replacement and updated per active draw.
- `setEffect()` compiles and links before swapping programs, so failed replacements preserve the prior effect.
  `clearEffect()` retains reusable geometry; `destroy()` independently detaches the hook and deletes owned resources.
- The Chromium fixture now renders the shader below RGBA textures, ordered sprites, the line overlay, and the final
  post-process effect.

## Archive Instructions

When completed, move this file to `docs/todos/archived/`, add its completion entry to `docs/todos/_index.md`, and record
the final shader interface, uniform contract, replacement behavior, and visual coverage.
