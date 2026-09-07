---
title: 'TODO: Lazy-load WASM background rendering'
priority: Medium
effort: 1-2d
created: 2026-09-06
issue: https://github.com/andorthehood/8f4e/issues/958
status: Open
completed: null
---

# TODO: Lazy-load WASM Background Rendering

## Problem Description

The web UI eagerly imports `createWasmFrameTextureDrawer` and `RgbaTextureLayer`, and constructs a texture layer for
every editor. Projects without a framebuffer background still download its implementation and initialize its resources.

## Proposed Solution

Load the background drawer and RGBA layer implementation only when the resolved frame-texture configuration first
requires them. Keep configuration/schema discovery available during startup. Share the module-loading promise while
keeping rendering resources owned by each editor instance.

## Implementation Plan

1. Measure the production entry and its static dependencies before changing the import boundary. Check whether the
   engine's package exports allow the RGBA implementation to stay outside the initial bundle.
2. Introduce an asynchronous loader triggered by resolved background configuration. Start drawing once the latest
   configuration, compiled code, and memory are ready; preserve background ordering relative to other layers.
3. Handle configuration changes and disposal while loading, release resources when appropriate, and preserve rendering
   pause/resume and resource-release behavior.
4. Verify the emitted chunks and compare initial minified/gzip bytes and first-background readiness.

## Success Criteria

- [ ] Editors without a configured framebuffer background neither fetch the optional implementation nor create its layer.
- [ ] Initial configuration and later configuration changes activate the correct background.
- [ ] Concurrent editors share module loading but retain independent resources.
- [ ] Late or failed loads cannot resurrect disposed resources or leave unhandled rejections.
- [ ] Rendering order, memory/code updates, and resource release/resume retain their behavior.
- [ ] Before/after production measurements demonstrate the initial-download savings.

## Affected Components

- `packages/editor/packages/editor-core/packages/web-ui/src/index.ts`
- `packages/editor/packages/editor-core/packages/web-ui/src/drawers/wasmFrameTexture.ts`
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/plugins/rgba-texture-layer/`
- `packages/editor/packages/editor-core/src/webUiConfig.ts`

## Risks & Considerations

Adding a dynamic import is insufficient if another static import retains the same implementation. Inspect the final
website bundle, including any shared chunks. Loading must not introduce asynchronous work into every draw call.
Background projects may incur an extra request before their first background frame; measure that tradeoff.

## Validation Checkpoints

- Run `npx nx run-many --target=test --projects=@8f4e/web-ui,@8f4e/editor-core` and corresponding typechecks.
- Run `npx nx run @8f4e/editor-website:build` and inspect the resulting dependency graph and network requests.
- Exercise projects with and without backgrounds, configuration changes during loading, and disposal/release/resume.
- Run relevant web UI screenshot checks for layer ordering.

## Related Items

- [TODO 484: Lazy-load context-menu builders](archived/484-lazy-load-context-menu-builders.md) — another isolated initial-bundle reduction.

## References

- [Web UI initialization](../../packages/editor/packages/editor-core/packages/web-ui/src/index.ts)

## Notes

Identified through source inspection on 2026-09-06. Savings are unmeasured; establish a fresh baseline during implementation.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
