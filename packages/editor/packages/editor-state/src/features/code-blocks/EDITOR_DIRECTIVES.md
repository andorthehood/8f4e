# Editor Directives

Editor directives are special comment lines that provide metadata to the 8f4e editor but are completely ignored by the compiler. They use the format `; @directive ...` where the `@` symbol marks them as editor-specific.

## Available Editor Directives

### `; @debug <memoryId>`

Creates a debug output display for a memory value in the editor:

```
int counter 0
; @debug counter
```

### `; @button <id> [offValue] [onValue]`

Creates an interactive button control that writes values to memory:

```
int trigger 0
; @button trigger 0 1
```

Default values: `offValue=0`, `onValue=1`

### `; @switch <id> [offValue] [onValue]`

Creates an interactive toggle switch control:

```
int gate 0
; @switch gate 0 1
```

Default values: `offValue=0`, `onValue=1`

### `; @slider <id> [min] [max] [step]`

Creates an interactive slider control:

```
float gain 0.5
; @slider gain 0.0 1.0 0.01
```

### `; @plot <bufferId> [minValue] [maxValue] [lengthId]`

Creates a buffer visualization plot:

```
float[] waveform 128 0.0
; @plot waveform -1.0 1.0
```

Default values: `minValue=-8`, `maxValue=8`

### `; @scan <bufferId> <pointerId>`

Creates a buffer scanner visualization:

```
int[] buffer 64 0
int pointer 0
; @scan buffer pointer
```

### `; @piano <listId> <countId> [startingNote]`

Creates a piano keyboard input control:

```
int[] notes 12 0
int notesCount 0
; @piano notes notesCount 48
```

Default `startingNote=0`

### `; @offset <axis> <memoryId>`

Offsets the position of a code block based on a memory value:

```
int offsetY 0
; @offset y offsetY
```

Valid axes: `x`, `y`

## Important Notes

1. **Editor directives are compiler-invisible**: They are implemented as semicolon comments, so the compiler treats them as regular comments and ignores them completely.

2. **No backward compatibility with hash directives**: Previously, editor directives used the `# directive` format. This syntax has been replaced with `; @directive` to reserve `#` for future compiler features.

3. **Plain comments remain plain**: Regular semicolon comments without the `@` prefix (e.g., `; This is a note`) remain ordinary comments and are not interpreted as directives.

4. **Future compiler directives**: When compiler directive support is added in the future, they will use the `#` prefix (e.g., `#define`, `#include`). This is why editor directives have been moved to the `; @` format.

## Implementation

Editor directives are parsed by dedicated code parsers in the `features/` subdirectories. Each directive type has its own parser implementation.
