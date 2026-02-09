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

## Notes

- Directive parsing should be strict: plain comments like `; note` are not directives.
- Unknown directives should be ignored by editor sub-parsers unless explicitly supported by that feature.
