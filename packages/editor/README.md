# Editor Package

This package is the glue that connects the platform-agnostic editor state machine from
`@8f4e/editor-state` with browser APIs and the `@8f4e/web-ui` renderer. It wires browser events
(keyboard, mouse, and wheel) into the state machine, then hands the resulting state object
that describes the full application to a UI renderer that treats state as immutable input and
derives the UI purely from it. The renderer is intended to be pluggable so other platform
renderers can replace it.

## Responsibilities

- Initialize the editor-state store and event dispatcher for the web runtime.
- Wire browser input events into internal events: window `keydown`/`keyup`; canvas `mousedown`/`mouseup`/`mousemove`/`contextmenu`; window `wheel` when viewport dragging is enabled.
- Translate DOM input data into internal event payloads (coordinates, movement deltas, button state, canvas size).
- Initialize the UI renderer with state and memory views, and forward resize and post-process events.
- Expose state access, memory view updates, and state machine callbacks as extension points.
