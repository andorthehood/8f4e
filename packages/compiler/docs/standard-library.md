# Standard library

The compiler provides a small built-in standard library of reusable 8f4e functions.
Standard library functions are included by source id, then called like ordinary functions.

## Include syntax

Add an `includes` block near the top of the project, after the `8f4e/v1` header and before entries or other document blocks.

```8f4e
8f4e/v1

includes
include std/math/clamp
include std/events/risingEdge
include std/events/hasChanged
includesEnd

entry main
module main
; ...
moduleEnd
entryEnd
```

Each `include` line accepts one built-in include id. An include id may provide multiple overloads of the same function name.

Includes are resolved during project parsing. The compiler receives the included functions as ordinary function blocks, so overload resolution, stack typing, and `call` behavior are the same as user-defined functions.

## `std/math/clamp`

Provides `clamp`, which constrains a value to an inclusive minimum and maximum.

Available overloads:

- `clamp(int value, int minValue, int maxValue) -> int`
- `clamp(float value, float minValue, float maxValue) -> float`

Examples:

```8f4e
includes
include std/math/clamp
includesEnd

entry test
module clampExamples
push 7
push 0
push 5
call clamp
; stack: 5

push 0.25
push 0.5
push 1.0
call clamp
; stack: 0.5
moduleEnd
entryEnd
```

## `std/events/risingEdge`

Provides `risingEdge`, which compares the current value with a stored previous value, stores the current value, and returns `1` only when the current value is greater than the previous value.

Available overloads:

- `risingEdge(int currentValue, int* previousValue) -> int`
- `risingEdge(float currentValue, float* previousValue) -> int`

The second argument must be an address for the previous value state. This function writes the current value through that pointer before returning.

Example:

```8f4e
includes
include std/events/risingEdge
includesEnd

entry main
module triggerDetector
int* trigger
int previousTrigger
int out

push &out
push 0
store

push *trigger
call risingEdge &previousTrigger
if
 push &out
 push 1
 store
ifEnd
moduleEnd
entryEnd
```

## `std/events/hasChanged`

Provides `hasChanged`, which compares the current value with a stored previous value, stores the current value, and returns `1` when the values differ.

Available overloads:

- `hasChanged(int currentValue, int* previousValue) -> int`
- `hasChanged(float currentValue, float* previousValue) -> int`

The second argument must be an address for the previous value state. This function writes the current value through that pointer before returning.

Example:

```8f4e
includes
include std/events/hasChanged
includesEnd

entry main
module valueChangeDetector
float* input
float previousInput
int changed

push &changed
push *input
call hasChanged &previousInput
store
moduleEnd
entryEnd
```
