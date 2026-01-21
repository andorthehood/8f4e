# Slider Interaction Capture Ideas

Brainstorming on how to avoid code-block dragging when interacting with slider controls.

## Problem

Current fix clears `state.graphicHelper.draggedCodeBlock` when a slider is activated, which works but feels hacky and couples slider logic to drag state.

## Better Interaction Models

### 1) Stop Propagation on Pointer Down (Recommended)

- Introduce a `mousedown` handler in slider interaction.
- Hit-test sliders before drag start and set `event.stopPropagation = true`.
- Update `codeBlockDragger` to respect `stopPropagation` on `mousedown`.

Benefits:
- Clean separation of concerns.
- Matches typical UI event handling patterns.
- Minimal extra state.

Trade-offs:
- Requires small event flow change.

### 2) Pointer Capture State in `graphicHelper`

- Add `state.graphicHelper.pointerCapture = 'slider' | 'block' | ...`.
- Slider interaction sets capture on pointer down, releases on pointer up.
- `codeBlockDragger` only starts drag when capture is `undefined` or `'block'`.

Benefits:
- Extensible for future UI controls (knobs, XY pads).
- More explicit interaction ownership.

Trade-offs:
- Adds extra state and bookkeeping.

### 3) Reorder Event Handling

- Dispatch a custom `codeBlockPointerDown` event.
- Let sliders consume it first, and only then allow block drag start.

Benefits:
- Minimal code changes.

Trade-offs:
- Still order-dependent; harder to reason about as new UI elements are added.

