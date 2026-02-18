# Editor Directives

This document defines editor-only directives for code blocks.

## Directive Syntax

Editor directives use comment lines in this form:

```txt
; @<directive> <args...>
```

Examples:

```txt
; @debug counter
; @plot audioBuffer -2 2 lengthMemory
; @button gate0 0 1
```

These directives are editor metadata only. They are not compiler instructions and should be ignored by the compiler.

## Supported Directives

### `@debug`

Show a runtime debugger value for a memory id.

```txt
; @debug <memoryId>
```

### `@plot`

Draw a buffer plot for a buffer memory id.

```txt
; @plot <bufferMemoryId> [minValue] [maxValue] [bufferLengthMemoryId]
```

Defaults:
- `minValue`: `-8`
- `maxValue`: `8`

### `@scan`

Draw a scanner line using a pointer memory id over a buffer memory id.

```txt
; @scan <bufferMemoryId> <pointerMemoryId>
```

### `@slider`

Render a slider bound to a memory id.

```txt
; @slider <memoryId> [min] [max] [step]
```

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
- `pressedKeysListMemoryId` is used as both keyboard id and pressed-key buffer memory id.
- `startingMidiNote` defaults to `0`.

### `@offset`

Apply code-block visual position offset from an integer memory value.

```txt
; @offset <axis> <memoryId>
```

Where:
- `axis` is `x` or `y`.

### `@favorite`

Mark a code block as a favorite for quick navigation.

```txt
; @favorite
```

When a code block contains this directive, it appears in the "Jump to..." submenu of the main context menu (right-click on empty space). Selecting a favorite from the submenu will jump to and center the viewport on that code block.

Use this to bookmark important modules, functions, or other blocks in large projects for faster navigation.

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
    "code": ["module foo", "; @pos 5 10", "moduleEnd"],
    "gridCoordinates": { "x": 0, "y": 0 },
    "disabled": false
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
- The `disabled` field is included only when `true` (omitted when `false`)
- Blocks are ordered by their creation index for deterministic ordering
- No envelope metadata (`type`, `version`, etc.) is added to the payload

**Note:** The clipboard format uses `gridCoordinates` for paste mechanics only. In saved projects, position is stored in the `@pos` directive within code, not as a separate field.

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
