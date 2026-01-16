---
title: 'TODO: Add glugglug shader error callback for editor logging'
priority: Medium
effort: 2-4h
created: 2026-01-16
status: Open
completed: null
---

# TODO: Add glugglug shader error callback for editor logging

## Problem Description

Fragment shader compile failures in glugglug currently throw or log without a structured path back to the editor.
When a post-process effect shader fails, the error is uncaught and the UI cannot surface a meaningful message.
This makes shader authoring difficult and breaks the render loop instead of degrading gracefully.

## Proposed Solution

Introduce an optional shader error callback in glugglug that reports compile/link errors with effect name and
optional line number extracted from the GLSL info log. When an effect fails to compile, skip the effect and
continue rendering. Thread the callback through web-ui and editor init so the editor can log to console for now.

## Implementation Plan

### Step 1: Define error payload and parsing helpers in glugglug
- Add `ShaderErrorStage` (`vertex`, `fragment`, `link`) and `ShaderError` type in `glugglug`.
- Parse GLSL error logs for `ERROR: 0:<line>:` and store the line when available.
- Establish policy: on compile/link failure, emit callback and skip effect (no throw).

### Step 2: Plumb callback through glugglug runtime
- Add `onShaderError?: (error: ShaderError) => void` to `EngineOptions`.
- Pass it through `Engine` -> `Renderer`/`CachedRenderer` -> `PostProcessManager`.
- Update `createShader`/`createProgram` to return `null` on failure and report via callback.
- Update `PostProcessManager.addEffect` to short-circuit when shader creation fails.

### Step 3: Expose callback in web-ui and editor init
- Extend web-ui `init` to accept optional `onShaderError` and forward it to `Engine`.
- Extend editor init options to accept `onShaderError` and pass it to web-ui.
- Default behavior: `console.error('[glugglug] shader <stage> error effect=<name> line=<n>: <infoLog>')`.

## Success Criteria

- [ ] Shader compile failures no longer throw uncaught errors during post-process effect loading
- [ ] Failed effects are skipped and rendering continues with remaining effects
- [ ] Editor logs a structured shader error with effect name and line when available

## Affected Components

- `packages/editor/packages/glugglug/src/types.ts` - add callback and error types
- `packages/editor/packages/glugglug/src/utils/createShader.ts` - compile error handling + callback
- `packages/editor/packages/glugglug/src/utils/createProgram.ts` - link error handling + callback
- `packages/editor/packages/glugglug/src/postProcess/PostProcessManager.ts` - skip failed effects
- `packages/editor/packages/glugglug/src/renderer.ts` - pass callback to manager
- `packages/editor/packages/glugglug/src/CachedRenderer.ts` - pass callback to manager
- `packages/editor/packages/glugglug/src/engine.ts` - accept options and pass through
- `packages/editor/packages/web-ui/src/index.ts` - expose `onShaderError` option
- `packages/editor/src/index.ts` - forward handler from editor init options

## Risks & Considerations

- **Silent failures**: Skipping effects should still surface clear logs to avoid confusion.
- **API surface**: New optional callback should be non-breaking; ensure defaults preserve existing behavior.
- **Logging volume**: Avoid logging source strings to keep console output manageable.

## Related Items

- **Related**: TODO 170 (toggle post-process effects) for potential UI wiring
- **Related**: TODO 166 (default vertex shader for post-process effects)

## Notes

- GLSL line numbers from WebGL info logs are typically 1-based and use the `ERROR: 0:<line>:` format.
- Initial integration should only log to console; UI error panels can come later.
