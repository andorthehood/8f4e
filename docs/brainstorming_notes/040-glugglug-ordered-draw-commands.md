# Glugglug Ordered Draw Commands

Date: 2026-04-11

This note captures the main rendering architecture problem in `glugglug` and the simplest direction for fixing it.

## Short version

Right now `glugglug` does not really render things in the order the draw functions are called.

Instead, it groups work by implementation details:

- sprite batches
- cached textures
- special-case rendering paths

That is fast for the current built-in features, but it becomes fragile as soon as we add a new kind of draw call like:

- shader-driven plots
- custom program rectangles
- future GPU widgets

The result is that draw order becomes hard to predict.

That is why the recent `@plot` experiment kept breaking in different ways:

- sometimes it rendered on top of everything
- sometimes it rendered under everything
- sometimes it disappeared in cached blocks
- sometimes it only updated when cache state changed

The core issue is not the shader. The core issue is that draw order is not the source of truth in the renderer.

## What is happening today

The current engine behaves more like this:

1. drawing functions fill different internal buffers
2. later, those buffers are rendered using different code paths
3. caching has its own special rendering behavior
4. the final visible order depends on those internal paths, not just on the order the public API was called

This means:

- `drawSprite(...)` does not have the same architectural status as `drawCachedContent(...)`
- a new `drawProgramRect(...)` call is not naturally integrated
- cached and uncached rendering can behave differently

That is exactly what we saw in the plot experiment.

## The fix in plain language

The renderer should first remember **what was asked to be drawn**, in order.

Then it should render that remembered list in the same order.

So instead of public API calls directly pushing work into different special systems, they should all record ordered draw commands.

For example:

- `drawSprite(...)` records a sprite command
- `drawLine(...)` records a line command
- `drawCachedContent(...)` records a cached-texture command
- `drawProgramRect(...)` records a program-rect command

Then, later in the frame:

1. replay the recorded commands in order
2. batch neighboring compatible commands together as an optimization

That way:

- the call order is always correct
- batching is still possible
- caching can reuse the same logic

## Why this is better

This would make the renderer much easier to reason about.

Today the mental model is:

- "what buffer did this call write into?"
- "does cache capture use the same path?"
- "does this go through `Renderer` or `CachedRenderer`?"
- "when is this queue flushed?"

With ordered draw commands, the mental model becomes:

- "I called draw A, then draw B, then draw C"
- "they will appear as A, then B, then C"

That is the behavior we actually want.

## Would this hurt performance?

Not necessarily.

The important idea is:

- draw commands are the source of truth
- batching is still the optimization

So the renderer can still batch adjacent compatible commands together.

For example:

- many neighboring sprite commands using the same texture can still be rendered in one batch
- many neighboring cached-texture commands can still be grouped
- many neighboring program-rect commands using the same shader can still be grouped if useful

The engine would not be giving up batching.

It would just stop letting batching decide semantics.

That is a much healthier architecture.

## What the renderer should look like

The long-term direction should be:

- one ordered command list for the frame
- one replay path that walks that list in order
- one cache system that uses the same replay logic for offscreen capture

This suggests:

- keep `Engine`
- keep one `Renderer`
- turn caching into a helper/system, not a separate renderer behavior model

In other words:

- `CachedRenderer` as a fundamentally different rendering path is probably the wrong shape

## Suggested command types

The exact list can stay small at first:

- `sprite`
- `line`
- `cachedTexture`
- `programRect`

That is already enough to support the current engine plus the shader-plot experiment.

## Safe migration plan

This should be done in steps instead of rewriting everything at once.

### Step 1

Introduce an internal ordered draw-command model.

Public calls like `drawSprite(...)` and `drawLine(...)` should record commands instead of directly deciding rendering behavior.

### Step 2

Replay only the existing sprite and cached-texture commands first.

Do not try to solve every future primitive at the same time.

### Step 3

Make cache capture reuse the same command replay path.

This is the key simplification. Cache rendering should not be a separate custom rendering universe.

### Step 4

Add `programRect` as a normal ordered command.

At that point shader-driven plots and future GPU widgets become much easier to support cleanly.

## Main takeaway

The biggest problem is not that the new plot experiment used shaders.

The biggest problem is that `glugglug` currently batches by implementation type instead of rendering by ordered commands.

If we want everything to appear in the order the API is called, that needs to become the first-class rule of the engine.
