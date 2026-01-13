---
title: 'TODO: Add Background Effects'
priority: Medium
effort: 2-4d
created: 2026-01-02
status: Open
completed: null
---

# TODO: Add Background Effects

## Problem Description

The glugglug engine supports post-process effects but has no background-only pipeline for procedural shaders. This blocks adding layered background visuals (e.g., plasma) while keeping sprite rendering and post-process behavior intact.

## Proposed Solution

Add a background effect pipeline inside glugglug that renders one or more full-screen quads before sprites, with procedural-only shaders and alpha blending enabled by default. The pipeline mirrors post-process conventions (effect list, enabled flag, uniform buffer mapping) while using its own buffer and fallback shader.

Alternative: reuse post-process effects with a scope flag, but that risks state coupling and unintended behavior across passes.

## Implementation Plan

### Step 1: Add background effect types and manager
- Define `BackgroundEffect` (name, vertex/fragment shaders, optional uniforms, enabled flag) aligned with post-process.
- Implement `BackgroundEffectManager` with its own shared uniform buffer and fallback shader that outputs transparent pixels.
- Provide standard uniforms `u_time` and `u_resolution`; no `u_renderTexture`.

### Step 2: Render pipeline integration
- In `Renderer.renderWithPostProcessing`, render background effects after `startRenderToTexture()` and before sprite draws.
- In `CachedRenderer.renderWithPostProcessing`, render background effects before the segment draw loop.
- Keep alpha blending enabled for background effects by default; no per-effect blending config.

### Step 3: Public API surface
- Add engine/renderer methods: `addBackgroundEffect`, `removeBackgroundEffect`, `removeAllBackgroundEffects`, `updateBackgroundUniforms`, `setBackgroundEffectEnabled`, `getBackgroundBuffer`.
- Export `BackgroundEffect` (and manager if desired) from glugglug index.

## Success Criteria

- [ ] Background effects render before sprites and appear behind them.
- [ ] Multiple background effects layer via alpha blending.
- [ ] Fallback path renders a fully transparent background when no effects are enabled.
- [ ] Post-process effects remain unchanged.

## Affected Components

- `packages/editor/packages/glugglug/src/background/BackgroundEffectManager.ts` - New background effect pipeline.
- `packages/editor/packages/glugglug/src/types/postProcess.ts` or new `packages/editor/packages/glugglug/src/types/background.ts` - Background effect types.
- `packages/editor/packages/glugglug/src/renderer.ts` - Background render pass integration.
- `packages/editor/packages/glugglug/src/CachedRenderer.ts` - Background render pass integration for cached rendering.
- `packages/editor/packages/glugglug/src/engine.ts` - Public API methods for background effects.
- `packages/editor/packages/glugglug/src/index.ts` - Export background effect types/manager.

## Risks & Considerations

- **State restoration**: Background rendering must restore shader attributes/state for sprite rendering.
- **Performance**: Additional fullscreen passes per background effect.
- **Compatibility**: Keep post-process pipeline unchanged.

## Related Items

- **Related**: `docs/todos/155-glugglug-framebuffer-memory-accounting.md`
- **Related**: `docs/todos/166-default-post-process-vertex-shader.md`

## Notes

- Procedural-only: background shaders do not sample textures.
- Alpha blending is enabled by default for background effects.
