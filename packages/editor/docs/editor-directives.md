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

### `@group`

Assign a code block to a named group for coordinated movement.

```txt
; @group <groupName>
```

When a code block contains this directive, holding the Alt/Option key while dragging the block will move all blocks with the same group name together. This is useful for keeping related modules, functions, or other blocks positioned relative to each other.

Examples:

```txt
; @group audio-chain
; @group visualizers
; @group utilities
```

Notes:
- Group names are case-sensitive.
- Group names can contain letters, numbers, hyphens, and underscores.
- Group names should not contain spaces (the first token after @group is used as the group name).
- Blocks without a group directive or with different group names are unaffected by grouped drag.
- Normal drag behavior (without Alt/Option) remains unchanged.

## Notes

- Directive parsing should be strict: plain comments like `; note` are not directives.
- Unknown directives should be ignored by editor sub-parsers unless explicitly supported by that feature.
