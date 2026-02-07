---
title: 'TODO: Add Background Effect'
priority: Medium
effort: 2-4d
created: 2026-01-02
status: Completed
completed: 2026-02-03
---

# TODO: Add Background Effect

## Problem Description

The glugglug engine supports a post-process effect but has no background pipeline for procedural shaders. This blocks adding a procedural background visual (e.g., plasma) while keeping sprite rendering and post-process behavior intact.

## Proposed Solution

Add a single background effect inside glugglug that renders one full-screen quad before sprites, with a procedural shader and alpha blending enabled. The background effect mirrors the post-process conventions (uniform buffer mapping, standard uniforms) while using its own shared buffer. The fallback when no background effect is set renders a fully transparent quad.

## Implementation Plan

### Step 1: Add background effect type and manager
- Define `BackgroundEffect` (vertex/fragment shaders, optional uniforms) aligned with `PostProcessEffect` — no `name` or `enabled` field.
- Implement `BackgroundEffectManager` with its own shared uniform buffer and a fallback shader that outputs transparent pixels.
- Provide standard uniforms `u_time` and `u_resolution`; no `u_renderTexture`.

### Step 2: Render pipeline integration
- In `Renderer.renderWithPostProcessing`, render the background effect after `startRenderToTexture()` and before sprite draws.
- In `CachedRenderer.renderWithPostProcessing`, render the background effect before the segment draw loop.
- Alpha blending is enabled for the background pass; no per-effect blending config.

### Step 3: Public API surface
- Add engine/renderer methods: `setBackgroundEffect`, `clearBackgroundEffect`, `updateBackgroundUniforms`, `getBackgroundBuffer`.
- Export `BackgroundEffect` type from glugglug index.

## Success Criteria

- [x] The background effect renders before sprites and appears behind them.
- [x] Fallback path renders a fully transparent background when no effect is set.
- [x] Post-process effect remains unchanged.

## Affected Components

- `packages/editor/packages/glugglug/src/background/BackgroundEffectManager.ts` - New background effect manager (single effect).
- `packages/editor/packages/glugglug/src/types/background.ts` - `BackgroundEffect` type.
- `packages/editor/packages/glugglug/src/renderer.ts` - Background render pass integration.
- `packages/editor/packages/glugglug/src/CachedRenderer.ts` - Background render pass integration for cached rendering.
- `packages/editor/packages/glugglug/src/engine.ts` - Public API methods for the background effect.
- `packages/editor/packages/glugglug/src/index.ts` - Export background effect type.

## Risks & Considerations

- **State restoration**: Background rendering must restore shader attributes/state for sprite rendering.
- **Compatibility**: Keep post-process pipeline unchanged.

## Related Items

- **Related**: `docs/todos/155-glugglug-framebuffer-memory-accounting.md`
- **Related**: `docs/todos/185-simplify-post-process-single-effect.md`

## Notes

- Procedural-only: the background shader does not sample textures.
- Alpha blending is enabled by default for the background pass.
- Mirrors the single-effect pattern established by the post-process pipeline (see todo 185).
