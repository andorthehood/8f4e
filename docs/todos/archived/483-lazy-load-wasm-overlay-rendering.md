---
title: 'TODO: Lazy-load WASM overlay rendering'
priority: Medium
effort: 1-2d
created: 2026-09-06
issue: https://github.com/andorthehood/8f4e/issues/958
status: Completed
completed: 2026-09-11
---

# TODO: Lazy-load WASM Overlay Rendering

## Problem Description

The web UI eagerly imports `createWasmOverlayTextureDrawer` and `RgbaTextureLayer`, and constructs a texture layer for
every editor. Projects without a framebuffer overlay still download its implementation and initialize its resources.

## Proposed Solution

Load the overlay drawer and RGBA layer implementation only when the resolved overlay-texture configuration first requires
them. Keep configuration/schema discovery available during startup. Share the module-loading promise while keeping
rendering resources owned by each editor instance.

## Implementation Plan

1. Measure the production entry and its static dependencies before changing the import boundary. Check whether the
   engine's package exports allow the RGBA implementation to stay outside the initial bundle.
2. Introduce an asynchronous loader triggered by resolved overlay configuration. Start drawing once the latest
   configuration, compiled code, and memory are ready; preserve topmost overlay ordering relative to other layers.
3. Subscribe to overlay configuration changes instead of polling configuration during every frame. Handle disposal while
   loading, release resources when appropriate, and preserve rendering pause/resume and resource-release behavior.
4. Verify the emitted chunks and compare initial minified/gzip bytes and first-overlay readiness.

## Success Criteria

- [x] Editors without a configured framebuffer overlay neither fetch the optional implementation nor create its layer.
- [x] Initial configuration and later configuration changes activate the correct overlay.
- [x] Concurrent editors share module loading but retain independent resources.
- [x] Late loads cannot resurrect disposed resources.
- [x] Rendering order, memory/code updates, and resource release/resume retain their behavior.
- [x] Before/after production measurements demonstrate the initial-download savings.

## Affected Components

- `packages/editor/packages/editor-core/packages/web-ui/src/index.ts`
- `packages/editor/packages/editor-core/packages/web-ui/src/drawers/wasmOverlayTexture.ts`
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/plugins/rgba-texture-layer/`
- `packages/editor/packages/editor-core/src/webUiConfig.ts`

## Risks & Considerations

Adding a dynamic import is insufficient if another static import retains the same implementation. Inspect the final
website bundle, including any shared chunks. Loading must not introduce asynchronous work into every draw call.
Overlay projects may incur an extra request before their first overlay frame; measure that tradeoff.

## Validation Checkpoints

- Run `npx nx run-many --target=test --projects=@8f4e/web-ui,@8f4e/editor-core` and corresponding typechecks.
- Run `npx nx run @8f4e/editor-website:build` and inspect the resulting dependency graph and network requests.
- Exercise projects with and without overlays, configuration changes during loading, and disposal/release/resume.
- Run relevant web UI screenshot checks for layer ordering.

## Related Items

- [TODO 484: Lazy-load context-menu builders](484-lazy-load-context-menu-builders.md) — another isolated initial-bundle reduction.

## References

- [Web UI initialization](../../../packages/editor/packages/editor-core/packages/web-ui/src/index.ts)

## Notes

Completed on 2026-09-11. The overlay drawer and RGBA layer now share one cached dynamic module load while each editor
creates and owns its own layer only when a complete overlay configuration is present. Removing or replacing the
configuration pushes an update to the view, which destroys the old layer and its GPU resources without polling on every
frame. Disposal during loading cannot create a late layer.

In the `@8f4e/editor-default` production build, the initial shared editor chunk changed from 388.76 kB raw / 93.89 kB
gzip to 378.27 kB raw / 91.48 kB gzip. The deferred overlay chunk is 11.61 kB raw / 4.31 kB gzip. Overlay-free editors
therefore save about 10.49 kB raw / 2.41 kB gzip and avoid the overlay shader and fullscreen-geometry allocations.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
