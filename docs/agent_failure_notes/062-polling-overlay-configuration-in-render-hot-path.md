---
title: Agent Failure Note - Polling overlay configuration in the render hot path
agent: Codex
model: GPT-5
date: 2026-09-11
---

# Agent Failure Note - Polling overlay configuration in the render hot path

## Short Summary

While lazy-loading the WASM overlay renderer, the agent checked for overlay configuration changes from every rendered
frame. This mixed infrequent configuration and resource-lifecycle work into a performance-sensitive loop instead of
reacting to the editor state's existing change notifications.

## Original Problem

TODO 483 asked to keep the overlay renderer out of the initial bundle and load it only when an editor had a complete
overlay configuration. The overlay also needed to react when global directives changed that configuration at runtime.

The initial implementation passed a `getOverlayTexture` callback from editor-core to web-ui and called
`syncWasmOverlayTexture()` inside `drawFrame()`:

```ts
const drawFrame = () => {
	syncWasmOverlayTexture();
	drawBackground(draw, state);
	// ...draw the rest of the editor
};
```

The synchronization path resolved configuration, serialized it with `JSON.stringify`, compared keys, and potentially
started a dynamic import or rebuilt GPU resources. Most frames observed no configuration change, so this work existed
only to discover rare updates. A pull-based getter looked convenient because it avoided wiring a notification path, but
it made frame cost depend on control-plane state that already had an event source.

## Anti-Patterns

- Polling infrequently changing configuration from an animation or rendering loop.
- Putting configuration comparison, serialization, dynamic-import initiation, or resource replacement in a frame path.
- Adding a getter callback to cross an ownership boundary when the owning state store already exposes subscriptions.
- Treating the framebuffer's need for per-frame drawing as evidence that its configuration must also be checked per
  frame.
- Accepting a cheap no-change branch without accounting for its cost at the editor's frame rate and across editor
  instances.

The key distinction is between data-plane work and control-plane work. Uploading and drawing pixels belongs in the frame
loop because the WASM buffer may change every frame. Deciding which overlay exists and managing its resources belongs in
the configuration-change path.

## Failure Pattern

Using render-loop polling to observe cold state instead of pushing changes from the state owner's notification system.

## Correct Solution

Editor-core should resolve the initial overlay configuration once, pass it into web-ui initialization, and subscribe to
`editorConfig.webUI` through the existing state manager. The subscription callback re-resolves the configuration and
pushes it to the view through `setOverlayTexture(config | undefined)`.

Web-ui should synchronize the lazy module and texture-layer lifecycle only at three boundaries:

1. Initial view setup.
2. An explicit `setOverlayTexture(...)` call after configuration changes.
3. Completion of the lazy module import, using the latest configuration.

The editor must unsubscribe during disposal, and a late import completion must not recreate resources after the view has
been destroyed. The RGBA layer's draw callback remains in the render loop so changing framebuffer pixels still appear on
each frame.

Tests should verify both sides of the boundary: editor-core subscribes, pushes updated configuration, and unsubscribes;
web-ui creates, replaces, and destroys overlay resources in response to setter calls without relying on `renderFrame()`
to notice configuration changes.

This incident reinforces the broader lesson in
[Rendering hot path semantic derivation](037-render-hot-path-semantic-derivation.md): renderers should consume prepared
state, while derivation and lifecycle changes happen at their owning state boundaries.
