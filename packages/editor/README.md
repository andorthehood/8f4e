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

## Docs

- `docs/editor-directives.md` - Editor-only code-block directive syntax (`; @...`) and supported directives.

## Color Config

Configure colors in `config project` blocks using the `colorScheme` path.

- `config project` owns `colorScheme` (all text, fill, and icon colors).
- `config editor` only controls editor presentation settings like `font`.
- Color values should be valid color strings (for example `#101820` or `rgba(255,255,255,0.65)`).
- Main groups are `colorScheme.text`, `colorScheme.fill`, and `colorScheme.icons`.

Example project config overrides:

```txt
config project
scope "colorScheme.fill.moduleBackground"
set "#101820"

rescope "colorScheme.fill.wire"
set "rgba(255,255,255,0.65)"

rescope "colorScheme.text.instruction"
set "#b388ff"

rescope "colorScheme.icons.feedbackScale"
push "#ff0000"
push "#cc0033"
push "#990066"
push "#660099"
push "#3300cc"
push "#0000ff"
set
configEnd
```
