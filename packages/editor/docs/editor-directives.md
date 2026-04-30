# Editor Directives

This document defines editor-only directives for code blocks.

## Directive Syntax

Editor directives use comment lines in this form:

```txt
; @<directive> <args...>
```

You can also chain multiple directives in one comment line:

```txt
; @stop 1 01 @favorite
```

When directives are chained, parsing starts a new directive at the next `@name` token.

Examples:

```txt
; @watch counter
; @plot &audioBuffer lengthMemory
; @button gate0 0 1
; @config font ibmvga8x16
```

These directives are editor metadata only. They are not compiler instructions and should be ignored by the compiler.

## Supported Directives

### `@config`

Set editor configuration values.

```txt
; @config <path> <value>
```

Supported paths:

- `font` - editor font used for rendering code blocks and UI text.
- `runtime` - runtime host loaded for the project.
- `color.<path>` - editor color scheme override. See [Color Paths](./color-paths.md) for the full list of color paths.
- `export.fileName` - base file name used by editor export actions.

Examples:

```txt
; @config font ibmvga8x16
; @config runtime AudioWorkletRuntime
; @config export.fileName samplePlayer
; @config color.text.code #cccccc
; @config color.fill.moduleBackground rgba(0,0,0,0.9)
```

Supported `font` values:

- `ibmvga8x16`
- `terminus8x16`
- `terminus8x16bold`
- `6x10`
- `terminus10x18`
- `terminus10x18bold`
- `kana12x13`
- `terminus12x24`
- `terminus12x24bold`
- `spleen5x8`
- `spleen6x12`
- `spleen8x16`
- `templeos8x8`
- `spleen12x24`
- `spleen16x32`

### `@watch`

Show a runtime debugger value for a memory id.

```txt
; @watch <memoryId>
```

Supported `memoryId` forms:

- `name` - Show the current value.
- `0bname` - Show an integer value in binary.
- `0xname` - Show an integer value in hexadecimal.
- `&name` - Show the start address.
- `name&` - Show the end address.
- `*name` - Dereference a pointer memory.
- `module:name` - Resolve `name` from another module.
- `name[3]` - Show a specific array element.

These modifiers can be combined when they make sense. For example:

```txt
; @watch 0bcounter
; @watch 0xcounter
; @watch &buffer
; @watch pointer&
; @watch *out
; @watch otherModule:value
; @watch buffer[3]
```

### `@nth`

Show the module's 1-based compile order number.

```txt
; @nth
```

Notes:

- This reflects compile/layout order.
- The first module shows `1`, the sixteenth shows `16`.

### `@plot`

Draw a plot over a typed absolute pointer range or direct buffer memory. The first argument provides the start pointer and element type metadata. The second argument is always the element count. You can optionally provide an explicit min/max range override.

```txt
; @plot <startPointer|&buffer|buffer> <elementCount|elementCountMemoryId>
; @plot <startPointer|&buffer|buffer> <elementCount|elementCountMemoryId> <minValue> <maxValue>
```

Range detection:

- float arrays use `-1..1`
- integer arrays use type-derived bounds, matching `@wave`
- lengths can be literal counts, memory ids, or `count(buffer)`
- if `minValue` and `maxValue` are specified, they override the type-derived defaults

### `@meter`

Render a horizontal level meter from a typed scalar memory value. The first argument is the memory id to read. You can optionally provide an explicit min/max range override.

```txt
; @meter <memoryId>
; @meter <memoryId> <minValue> <maxValue>
```

Notes:

- plain scalar memories are supported directly
- pointer-based values and dereferenced ids still work when they resolve to a typed value
- red still starts at a fixed 90% of the configured range

### `@wave`

Draw a waveform over a typed absolute pointer range. The first argument provides the start pointer and element size metadata, the second argument is the element count, and the optional third argument is an absolute pointer in the same address space.

```txt
; @wave <startPointer|&buffer> <elementCount|elementCountMemoryId> <absolutePointerMemoryId>
```

### `@wave2`

Same as `@wave`, but rendered at double height.

```txt
; @wave2 <startPointer|&buffer> <elementCount|elementCountMemoryId> <absolutePointerMemoryId>
```

### `@slider`

Render a slider bound to a memory address.

```txt
; @slider <memoryAddress> [min] [max] [step]
```

### `@crossfade`

Render a center-origin crossfade control bound to two float addresses. The left address is driven when the knob moves left, and the right address is driven when the knob moves right.

```txt
; @crossfade <leftFloatAddress> <rightFloatAddress>
```

Notes:

- both arguments must be addresses such as `&dry` and `&wet`
- both bound memories must resolve to float32 scalars
- the written range is fixed to `0..1` on each side

### `@button`

Render a momentary button bound to a memory id.

```txt
; @button <memoryId> [offValue] [onValue]
```

Defaults:

- `offValue`: `0`
- `onValue`: `1`

### `@switch`

Render a toggle switch bound to a memory id.

```txt
; @switch <memoryId> [offValue] [onValue]
```

Defaults:

- `offValue`: `0`
- `onValue`: `1`

### `@piano`

Render a piano keyboard control.

```txt
; @piano <pressedKeysListMemoryId> <pressedKeyCountMemoryId> [startingMidiNote]
```

Notes:

- `pressedKeysListMemoryId` is used as both keyboard id and pressed-key array memory id.
- `startingMidiNote` defaults to `0`.

### `@offset`

Apply code-block visual position offset from an integer memory value.

```txt
; @offset <axis> <memoryId>
```

Where:

- `axis` is `x` or `y`.

### `@tab`

Define a visual tab stop for literal tab characters within the code block.

```txt
; @tab <position1> <position2> ...
```

Notes:

- Each position must be a positive integer visual column.
- One `@tab` directive defines the full active stop list at that point in the block.
- If another valid `@tab` directive appears later, it replaces the active stop list from that line onward.
- A tab advances to the first declared stop strictly greater than the current visual column.
- The minimum tab advance is `1`.
- If no later declared stop exists, the tab falls back to advance `1`.
- Tabs remain literal `\t` characters in source code; the extra spacing is editor-rendered only.

Example:

```txt
module main
; @tab 4 8
int foo
int\tbar
; @tab 12 34 54
\tbaz
moduleEnd
```

### `@defAsset`

Define a named binary asset URL for later loading.

```txt
; @defAsset <id> <url>
```

Notes:

- Allowed in any block type.
- If the same `id` is defined multiple times, the last definition wins.
- Asset size constants are auto-generated in the env block as `ASSET_<ID>_SIZE`.

### `@loadAsset`

Load a previously defined asset into a memory location.

```txt
; @loadAsset <id> <memoryRef>
```

Notes:

- Allowed in any block type.
- Directives are evaluated in project order and use last-write-wins for duplicate paths.
- Invalid paths/values are ignored with a console warning.
- This is editor metadata only and does not affect compiler output.
- `<memoryRef>` must be an `&...` memory reference.
- Unknown asset ids are logged and skipped.
- Multiple loads for one asset are supported, but the recommended pattern is one load per asset and sharing that memory from other modules to reduce memory usage.

### `@favorite`

Mark a code block as a favorite for quick navigation.

```txt
; @favorite
```

When a code block contains this directive, it appears in the "Jump to..." submenu of the main context menu (right-click on empty space). Selecting a favorite from the submenu will jump to and center the viewport on that code block.

Use this to bookmark important modules, functions, or other blocks in large projects for faster navigation.

### `@home`

Mark a code block as the home block for initial viewport placement.

```txt
; @home [center|left|right|top|bottom]
```

When a project loads, the viewport moves to the first code block containing the `@home` directive. If no code block contains `@home`, the viewport defaults to position `(0,0)`.

**Behavior:**

- **Project Load**: On load, viewport moves to the first block with `@home` (determined by code block order).
- **Multiple @home**: If multiple blocks have `@home`, only the first one (by project order) is used.
- **No @home**: If no blocks have `@home`, viewport defaults to `(0,0)`.
- **Alignment**: Optional alignment hints match `@stop`: `center` (default), `left`, `right`, `top`, or `bottom`.
- **During Editing**: Use the "Go @home" main menu action (right-click on empty space) to return the viewport to the home block at any time using the same alignment rule.

**Format:**
The canonical formats are:

- `; @home`
- `; @home top`
- `; @home bottom`
- `; @home left`
- `; @home right`
- `; @home center`

Example:

```txt
module mainOscillator
; @home top
; @pos 50 30
output out 1
moduleEnd
```

**Important:**

- Use `@home` to define the starting view for your project.
- Only one `@home` directive takes effect (the first block in project order).

### `@hide`

Hide everything after the directive line while the block is not selected.

```txt
; @hide
```

Notes:

- Everything after the `@hide` line is hidden while the block is unselected.
- Selecting the block expands the full source again for editing.
- Directives with arguments are ignored.
- If multiple valid `@hide` directives exist, the first one wins.
- Works with all block types (modules, functions, configs, constants, macros, shaders, comments).

### `@hidden`

Hide the contents of a code block until it is selected, while still leaving its corner markers visible.

```txt
; @hidden
```

Notes:

- While the block is unselected, only its `+` corner markers are rendered.
- Selecting the block makes it visible again.
- Holding `F9` reveals all hidden blocks temporarily without changing selection.
- When selection moves away, it becomes hidden again.
- Directives with arguments are ignored.
- Works with all block types (modules, functions, configs, constants, macros, shaders, comments).

### `@disabled`

Mark a code block as disabled to exclude it from compilation.

```txt
; @disabled
```

When a code block contains this directive, it is excluded from compilation and rendered with a transparent background. This is useful for temporarily disabling modules, functions, or other blocks without deleting them.

**Behavior:**

- **Project Load**: Disabled state is parsed from `@disabled` directive. Blocks without the directive are enabled by default.
- **Context Menu**: Use "Disable <blockLabel>" or "Enable <blockLabel>" menu items to toggle the directive.
- **Compilation**: Disabled blocks are filtered out before compilation, so they don't affect the compiled program.
- **Rendering**: Disabled blocks appear with a transparent/dimmed background in the editor.

**Format:**
The canonical format is exactly: `; @disabled`

Example:

```txt
module debugOscillator
; @disabled
; @pos 10 20
output debugOut 1
moduleEnd
```

**Important:**

- The `@disabled` directive is the source of truth for disabled state in saved projects.
- You can manually add or remove the directive to enable/disable blocks.
- Works with all block types (modules, functions, configs, constants, macros, shaders, comments).

### `@opacity`

Set the cached replay opacity of a code block in the editor.

```txt
; @opacity <0..1>
```

When present, this directive controls the opacity of the block's cached main body when it is rendered through the cache path.

**Rules:**

- The value must be a finite number between `0` and `1` inclusive.
- `0` means fully transparent cached replay.
- `1` means fully opaque cached replay.
- Missing, malformed, negative, or greater-than-`1` values are ignored and the block falls back to `1`.

**Behavior:**

- **Cached Rendering Only**: The opacity is applied only when the block is drawn from its cached texture.
- **Uncached Rendering**: Selected blocks and any other uncached draw path ignore `@opacity` and render normally.
- **Overlays**: Widgets and overlays drawn after the cached block body are unaffected.
- **Cache Reuse**: Changing `@opacity` does not invalidate or recreate the cached texture because the value is applied only at replay time.

**Format:**
The canonical format is: `; @opacity <value>`

Example:

```txt
module hud
; @opacity 0.65
; @pos 2 1
output out 1
moduleEnd
```

**Important:**

- Only the first valid `@opacity` directive in a block takes effect; later ones are ignored.
- This directive affects editor rendering only. It does not change compilation or serialized position/state behavior.
- If you need full-block fading including uncached overlays, that is outside the current behavior.

### `@pos`

Define the grid position of a code block in the editor.

```txt
; @pos <gridX> <gridY>
```

This directive stores the position of a code block within the project.

**Rules:**

- `gridX` and `gridY` must be strict integers (floats are rejected)
- Negative values are allowed
- Multiple `@pos` directives in one block are treated as invalid (position defaults to `0,0`)
- Malformed values (non-integers) are treated as invalid (position defaults to `0,0`)

**Behavior:**

- **Project Load**: Position is parsed from `@pos` directive. Missing or invalid directive defaults to `(0,0)`
- **Code Edit**: If you manually edit `@pos` to valid values, the block immediately moves to that position
- **Dragging**: When you drag a block, `@pos` is automatically updated when the drag ends (not during the drag)
- **Creation**: New blocks automatically get a canonical `@pos` directive based on creation location
- **Paste**: Pasted blocks automatically get `@pos` directives with adjusted positions

**Format:**
The canonical format is exactly: `; @pos ${gridX} ${gridY}`

Example:

```txt
module oscillator
; @pos 10 20
; @favorite
output out 1
moduleEnd
```

**Important:**

- The `@pos` directive is the source of truth for block position in saved projects
- During drag, `@pos` updates only on drag end (not during the drag)
- When `@viewport` is also present, `@pos` stores the inward offset from the anchored corner instead of world-space coordinates (see `@viewport`)

### `@viewport`

Pin a code block to a viewport corner so it stays visible as you pan around the project.

```txt
; @viewport <top-left|top-right|bottom-left|bottom-right>
```

When this directive is present, `@pos` is interpreted as an **inward offset** from the specified corner of the visible viewport instead of world-space grid coordinates.

**Accepted values:**

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`

**Offset semantics** — positive `@pos` values always move inward from the anchored edges:

- `top-left`: `+x` moves right, `+y` moves down
- `top-right`: `+x` moves left, `+y` moves down
- `bottom-left`: `+x` moves right, `+y` moves up
- `bottom-right`: `+x` moves left, `+y` moves up

`; @pos 0 0` with any anchor means "flush against the anchored corner".

**Clamping:**
Viewport-anchored blocks are always clamped to remain visible. If a block would be placed outside the viewport due to a large or negative `@pos` offset, its position is clamped so the anchored corner stays within the visible area. Oversized blocks pin the anchored corner and allow overflow only on the opposite side.

**Dragging:**
Dragging a viewport-anchored block works normally. When the drag ends, `@pos` is rewritten in anchored coordinates (not world-space), and `@viewport` is left unchanged.

**Important:**

- `@viewport` changes how `@pos` is interpreted but does **not** replace it. `@pos` remains the only persisted coordinate.
- When `@viewport` is absent the block uses normal world-space placement.
- Only the first `@viewport` directive in a block takes effect; duplicates are ignored.
- An unknown anchor value (anything other than the four listed above) is treated as if `@viewport` were absent.

Example:

```txt
module hud
; @viewport top-right
; @pos 2 1
output out 1
moduleEnd
```

This places the block two grid cells inward from the right edge and one grid cell down from the top edge of the viewport, regardless of where the user pans.

### `@alwaysOnTop`

Mark a code block as persistently top-most so it always renders above normal blocks.

```txt
; @alwaysOnTop
```

Without this directive, clicking a block brings it above all other blocks. With `@alwaysOnTop`, blocks are divided into two z-order partitions:

- **Normal blocks** — rendered first, in their relative array order
- **Always-on-top blocks** — rendered last (on top of all normal blocks), in their relative array order

Clicking a normal block brings it to the front of the normal segment only; it never rises above any always-on-top block.
Clicking an always-on-top block brings it to the front of the always-on-top segment.

**Important:**

- Rendering and hit-testing both derive from the same `codeBlocks` array order; no separate rendering pass is used.
- The directive takes no arguments; any text after `@alwaysOnTop` is ignored.
- `@alwaysOnTop` is compatible with `@viewport`; a viewport-anchored block may also be always-on-top.

Example:

```txt
module overlay
; @alwaysOnTop
; @viewport top-left
; @pos 1 1
output status 1
moduleEnd
```

This block stays pinned to the top-left corner of the viewport and is always rendered above all normal code blocks.

### `@group`

Assign a code block to a named group for coordinated movement.

```txt
; @group <groupName> [nonstick]
```

When a code block contains this directive, it can be moved together with other blocks sharing the same group name:

- **Default behavior (without `nonstick`)**: All blocks in the group move together when you drag any member. Hold `Alt/Option` to override and drag only the selected block (single-block drag)
- **With `nonstick` keyword**: Drag only the selected block by default (single-block drag). Hold `Alt/Option` to override and drag all blocks in the group together (group drag)

This is useful for keeping related modules, functions, or other blocks positioned relative to each other.

Examples:

```txt
; @group audio-chain
; @group visualizers nonstick
; @group utilities
```

**Menu Actions:**

When a code block belongs to a group, the context menu provides these actions:

- **Make Group Nonstick**: Adds the `nonstick` keyword to all blocks in the group, making them drag individually by default
- **Make Group Sticky**: Removes the `nonstick` keyword from all blocks in the group, returning to default group-drag behavior
- **Delete group**: Deletes all code blocks in the group immediately without confirmation (use with caution)
- **Copy group**: Copies all blocks in the group to clipboard as a multi-block JSON array (see Clipboard Behavior below)
- **Remove from group**: Removes the `@group` directive from the selected block only
- **Ungroup "<groupName>"**: Removes the `@group` directive from all blocks in the group

Notes:

- Group names are case-sensitive.
- Group names can contain letters, numbers, hyphens, and underscores.
- Group names should not contain spaces (the first token after @group is used as the group name).
- The `nonstick` keyword must be exactly `nonstick` (lowercase) to be recognized.
- By default, all blocks in a group move together when dragging. Use Alt/Option to override and drag a single block.
- Nonstick groups drag individually by default. Use Alt/Option to override and drag all blocks together.
- Ungrouped blocks are unaffected and always use single-block drag behavior.

## Clipboard Behavior

The editor supports two clipboard formats for copying and pasting code blocks:

### Single-Block Copy/Paste

When you copy a single code block (using "Copy module/function" in the context menu), it is copied to the clipboard as plain text with newline-separated code lines.

**Example:**

```txt
module oscillator
output out 1
moduleEnd
```

Pasting plain text creates a single new code block at the paste location.

### Multi-Block Copy/Paste (Groups)

When you copy a group (using "Copy group" in the context menu), all blocks in the group are copied to the clipboard as a JSON array.

**Format:**

```json
[
	{
		"code": ["module foo", "; @disabled", "; @pos 5 10", "moduleEnd"],
		"gridCoordinates": { "x": 0, "y": 0 }
	},
	{
		"code": ["module bar", "; @pos 17 14", "moduleEnd"],
		"gridCoordinates": { "x": 12, "y": 4 }
	}
]
```

**Rules:**

- `gridCoordinates` are **relative offsets** used only for paste positioning (not for project storage)
- Coordinates are relative to the copied anchor block (the selected block becomes `{x: 0, y: 0}`)
- When pasted, final position = paste location + relative offset, then `@pos` is updated in code
- Disabled state is stored in code via `@disabled` directive, not as a separate field
- Blocks are ordered by their creation index for deterministic ordering
- No envelope metadata (`type`, `version`, etc.) is added to the payload

**Note:** The clipboard format uses `gridCoordinates` for paste mechanics only. In saved projects, both position and disabled state are stored in directives within code (`@pos` and `@disabled`), not as separate fields.

**Paste Behavior:**

- The editor automatically detects whether clipboard content is a multi-block array or plain text
- A valid multi-block array must have at least 2 items with the required shape
- Pasted blocks are placed relative to the paste location (anchor position)
- Module/function IDs are automatically incremented to avoid collisions

**Group Name Collision Handling:**

When pasted blocks contain `@group` directives, group names are automatically renamed to avoid collisions with existing groups:

- If a group name ends with a number, that number is incremented: `audio1` → `audio2`
- If a group name doesn't end with a number, `1` is appended: `audio` → `audio1`
- The rename process repeats until a unique name is found
- All blocks with the same original group name get the same new group name

**Examples:**

- Paste `audio` when `audio` exists → becomes `audio1`
- Paste `audio1` when `audio` and `audio1` exist → becomes `audio2`
- Paste `bass09` when `bass09` and `bass10` exist → becomes `bass11`

**Fallback Behavior:**

Invalid clipboard content falls back to single-block paste behavior:

- Non-JSON text
- JSON that isn't an array
- Arrays with fewer than 2 items
- Arrays with items missing required fields (`code`, `gridCoordinates`)
- Arrays with items containing invalid data types

## Notes

- Directive parsing should be strict: plain comments like `; note` are not directives.
- Unknown directives should be ignored by editor sub-parsers unless explicitly supported by that feature.

### Export file name

Set the base file name used by editor export actions.

```txt
; @config export.fileName <value>
```

- `value` must be a non-empty single token (for example `samplePlayer` or `demo.wasm`)
- The editor strips `.json`, `.wasm`, and `.8f4e` suffixes before appending the export format extension

**Example**:

```txt
; @config export.fileName samplePlayer
```

### Runtime

Select the runtime host the editor should load for the project.

```txt
; @config runtime <runtimeId>
```

- `runtimeId` must be a known runtime id such as `WebWorkerLogicRuntime`, `MainThreadLogicRuntime`, or `AudioWorkletRuntime`
- Duplicate declarations use normal config last-write-wins behavior
- Unknown runtime ids produce an editor error and the editor falls back to the default runtime

**Example**:

```txt
; @config runtime AudioWorkletRuntime
```

For runtime directives (`; ~...`), see [runtime-directives.md](./runtime-directives.md).
