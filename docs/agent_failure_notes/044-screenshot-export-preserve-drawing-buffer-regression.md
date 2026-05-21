---
title: Agent Failure Note - Screenshot export preserveDrawingBuffer regression
agent: Codex App Version 26.429.30905 (2345)
model: GPT-5.5 (high)
date: 2026-05-03
---

# Agent Failure Note - Screenshot export preserveDrawingBuffer regression

## Short Summary

The agent implemented screenshot export by enabling `preserveDrawingBuffer` on the main WebGL context. That made a rare export operation easy, but it changed the steady-state render path and introduced a performance regression risk for every frame.

## Original Problem

The user asked for a menu option that saves the current canvas state as a PNG.

The first implementation added a `Take Screenshot` menu action and made `canvas.toBlob(...)` reliable by constructing the editor's WebGL context with:

```ts
canvas.getContext('webgl2', {
	antialias: false,
	alpha: false,
	preserveDrawingBuffer: true,
});
```

That worked functionally, but it changed how the browser can manage the drawing buffer during normal rendering. The screenshot action is a cold path. The render loop is a hot path. The implementation optimized for the cold path by weakening the hot path.

## Anti-Patterns

- Enabling a persistent WebGL context flag for a one-off export operation.
- Treating a convenient browser API path as acceptable without checking its render-loop cost.
- Solving screenshot capture in the main render configuration instead of in a dedicated export path.
- Ignoring existing project guidance to protect render-path performance.
- Failing to ask whether a feature runs every frame, on interaction, or only on demand.

The tempting reasoning was: `canvas.toBlob()` needs pixels to remain readable, and `preserveDrawingBuffer` makes that true. The missing step was recognizing that this setting affects every frame, not just screenshot capture.

## Failure Pattern

Paying a permanent hot-path performance cost to simplify a rare cold-path operation.

## Correct Solution

Keep the normal WebGL context configured for rendering performance. Screenshot export should pay its cost only when the user requests a screenshot.

Acceptable approaches include:

- Render one fresh frame synchronously and read the canvas immediately.
- Render to an export framebuffer or texture and read that result.
- Render into a temporary export canvas.
- Add a dedicated renderer capture API that isolates export behavior from the main animation loop.

The corrected implementation used a one-shot `renderFrame()` path before encoding the PNG. That preserves normal render performance and confines the extra work to screenshot export.

## Reusable Principle

Before changing WebGL context options, renderer configuration, cache behavior, or frame-loop logic, classify the feature as hot path or cold path. If the feature is cold path, do not add persistent costs to the hot path unless measurement proves the cost is acceptable and the trade-off is intentional.
