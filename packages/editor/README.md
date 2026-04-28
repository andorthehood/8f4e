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
- `docs/runtime-directives.md` - Runtime directive syntax (`; ~...`) and supported directives.

## Editor Config

Configure editor settings with `; @config <path> <value>`.

- Global editor directives control editor presentation settings like `font` and color overrides.
- `; @config runtime <runtimeId>` controls the runtime backend for the project.
- `; @config export.fileName <value>` controls the base file name used by editor export actions.
- `; @config color.<path> <value>` controls individual color scheme entries.
- Color values should be valid color strings (for example `#101820` or `rgba(255,255,255,0.65)`).
- Main groups are `text`, `fill`, and `icons`.

Example color overrides:

```txt
; @config color.fill.moduleBackground #101820
; @config color.fill.wire rgba(255,255,255,0.65)
; @config color.text.instruction #b388ff
; @config color.icons.feedbackScale0 #ff0000
; @config color.icons.feedbackScale1 #cc0033
; @config color.icons.feedbackScale2 #990066
; @config color.icons.feedbackScale3 #660099
; @config color.icons.feedbackScale4 #3300cc
; @config color.icons.feedbackScale5 #0000ff
```

- `docs/color-paths.md` - Configurable color paths for `; @config color.<path> <value>`.

## Font

Select the editor font with a global editor directive:

```txt
; @config font ibmvga8x16
```

Supported fonts: `6x10`, `ibmvga8x16`, `terminus8x16`, `terminus8x16bold`, `terminus10x18`, `terminus10x18bold`, `kana12x13`, `terminus12x24`, `terminus12x24bold`, `spleen5x8`, `spleen6x12`, `spleen8x16`, `templeos8x8`, `spleen12x24`, `spleen16x32`.
