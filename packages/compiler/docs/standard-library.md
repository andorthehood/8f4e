# Standard library

The 8f4e toolchain ships a small standard library of reusable 8f4e functions.
Standard library functions are included by source id, then called like ordinary functions.

## Include syntax

Add an `includes` block near the top of the project, after the `8f4e/v1` header and before entries or other document blocks.

```8f4e
8f4e/v1

includes
include std/math/clamp
include std/math/fract
include std/math/pow2
include std/math/trig/advancePhase
include std/math/trig/cosine
include std/math/trig/sine
include std/bitwise/extractBit
include std/bitwise/extractByte
include std/events/risingEdge
include std/events/hasChanged
include std/memory/advancePointer
include std/memory/loadAt
include std/memory/readInterpolated
include std/memory/storeAt
include std/memory/wrapPointer
include std/stack/dup
include std/stack/swap
includesEnd

entry main
module main
; ...
moduleEnd
entryEnd
```

Each `include` line accepts one standard library include id. An include id may provide multiple overloads of the
same function name.

Includes are resolved during project loading. The CLI loads the shipped standard library files from the installed
package, while browser-based tools load those same files lazily. The compiler receives the included source as ordinary
function blocks, so overload resolution, stack typing, and `call` behavior are the same as user-defined functions.

## `std/stack/dup`

Provides `dup`, which duplicates the top stack value.

Available overloads:

- `dup(int value) -> int int`
- `dup(float value) -> float float`

Examples:

```8f4e
includes
include std/stack/dup
includesEnd

entry test
module dupExamples
push 42
call dup
; stack: 42, 42
moduleEnd
entryEnd
```

## `std/stack/swap`

Provides `swap`, which exchanges the top two stack values.

Available overloads:

- `swap(int first, int second) -> int int`
- `swap(int first, float second) -> float int`
- `swap(float first, int second) -> int float`
- `swap(float first, float second) -> float float`

Examples:

```8f4e
includes
include std/stack/swap
includesEnd

entry test
module swapExamples
push 1
push 2.5
call swap
; stack: 2.5, 1
moduleEnd
entryEnd
```

## `std/memory/wrapPointer`

Provides `wrapPointer`, which bidirectionally wraps a byte address into a circular buffer range.

Available overloads:

- `wrapPointer(int pointer, int* buffer, int itemCount) -> int*`
- `wrapPointer(int pointer, float* buffer, int itemCount) -> float*`

`itemCount` is the circular buffer length in elements. The first argument is an untrusted computed byte address. The buffer argument supplies the typed circular range, and the return value is a valid pointer into that buffer.

Examples:

```8f4e
includes
include std/memory/wrapPointer
includesEnd

entry test
module wrapPointerExamples
float[] buffer 4
int pointer &buffer
const ITEM_COUNT count(buffer)

push pointer
push ITEM_COUNT
push sizeof(buffer)
mul
add
push &buffer
push ITEM_COUNT
call wrapPointer
; stack: &buffer

push pointer
push sizeof(buffer)
sub
push &buffer
push ITEM_COUNT
call wrapPointer
; stack: buffer&
moduleEnd
entryEnd
```

## `std/memory/advancePointer`

Provides `advancePointer`, which advances a mutable pointer by one element and wraps it within a circular buffer.

Available overloads:

- `advancePointer(int** pointer, int* buffer, int itemCount) -> void`
- `advancePointer(float** pointer, float* buffer, int itemCount) -> void`

`itemCount` is the circular buffer length in elements. The pointer argument is the address of the pointer variable to mutate.

Examples:

```8f4e
includes
include std/memory/advancePointer
includesEnd

entry test
module advancePointerExamples
float[] buffer 4
float* pointer &buffer

push &pointer
push &buffer
push count(buffer)
call advancePointer
; pointer is &buffer + sizeof(buffer)
moduleEnd
entryEnd
```

## `std/memory/loadAt`

Provides `loadAt`, which reads a value from a buffer by element index.

Available overloads:

- `loadAt(int* buffer, int index) -> int`

Examples:

```8f4e
includes
include std/memory/loadAt
includesEnd

entry test
module loadAtExamples
int[] buffer 4 11 22 33 44

push &buffer
push 2
call loadAt
; stack: 33
moduleEnd
entryEnd
```

## `std/memory/readInterpolated`

Provides `readInterpolated`, which reads two adjacent circular-buffer samples and linearly interpolates between them.

Available overloads:

- `readInterpolated(int pointer, int* buffer, int itemCount, float fraction) -> float`
- `readInterpolated(int pointer, float* buffer, int itemCount, float fraction) -> float`

`pointer` is an untrusted computed byte address. `itemCount` is the circular buffer length in elements. `fraction` is the interpolation amount between the wrapped sample at `pointer` and the next wrapped sample.

Examples:

```8f4e
includes
include std/memory/readInterpolated
includesEnd

entry test
module readInterpolatedExamples
float[] buffer 3 10.0 20.0 40.0
int pointer &buffer

push pointer
push &buffer
push count(buffer)
push 0.5
call readInterpolated
; stack: 15.0
moduleEnd
entryEnd
```

## `std/memory/storeAt`

Provides `storeAt`, which stores a value into a buffer by element index.

Available overloads:

- `storeAt(int* buffer, int index, int value) -> void`

Examples:

```8f4e
includes
include std/memory/storeAt
includesEnd

entry test
module storeAtExamples
int[] buffer 4

push &buffer
push 2
push 99
call storeAt
; buffer[2] is 99
moduleEnd
entryEnd
```

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

## `std/math/fract`

Provides `fract`, which returns the fractional part of a float by subtracting its integer-truncated value.

Available overloads:

- `fract(float value) -> float`

This helper is intended for positive values, such as fractional sample offsets. For negative inputs, the result follows integer truncation rather than positive modulo wrapping.

Examples:

```8f4e
includes
include std/math/fract
includesEnd

entry test
module fractExamples
push 3.25
call fract
; stack: 0.25
moduleEnd
entryEnd
```

## `std/math/pow2`

Provides `pow2`, which raises 2 to an integer exponent.

Available overloads:

- `pow2(int exponent) -> int`

Examples:

```8f4e
includes
include std/math/pow2
includesEnd

entry test
module pow2Examples
push 5
call pow2
; stack: 32
moduleEnd
entryEnd
```

## `std/math/trig/advancePhase`

Provides `advancePhase`, which advances a mutable float phase by one sample and wraps it from `PI` back to `-PI`.

Available overloads:

- `advancePhase(float* phase, float frequency, float sampleRate) -> float`

The phase increment is `TAU * frequency / sampleRate`, where `TAU` is derived from the built-in `[-PI, PI]` phase range. The updated phase is stored through the `phase` pointer and returned on the stack.

Examples:

```8f4e
includes
include std/math/trig/advancePhase
includesEnd

entry test
module advancePhaseExamples
float phase -3.141592653589793

push &phase
push 440.0
push 48000.0
call advancePhase
; stack: next phase
moduleEnd
entryEnd
```

## `std/math/trig/sine`

Provides `sine`, a float approximation for phases in `[-PI, PI]`.

Available overloads:

- `sine(float x) -> float`

`sine` uses a 7th-order Taylor polynomial with folding to `[-PI/2, PI/2]`.

Examples:

```8f4e
includes
include std/math/trig/sine
includesEnd

entry test
module sineExamples
push 0.0
call sine
; stack: 0.0
moduleEnd
entryEnd
```

## `std/math/trig/cosine`

Provides `cosine`, a float approximation for phases in `[-PI, PI]`.

Available overloads:

- `cosine(float x) -> float`

`cosine` uses a self-contained 6th-order Taylor polynomial with folding to `[-PI/2, PI/2]`. Standard library files are independent include units, so this helper does not call `sine`.

Examples:

```8f4e
includes
include std/math/trig/cosine
includesEnd

entry test
module cosineExamples
push 0.0
call cosine
; stack: about 1.0
moduleEnd
entryEnd
```

## `std/bitwise/extractBit`

Provides `extractBit`, which extracts one bit from a 32-bit integer.

Available overloads:

- `extractBit(int word, int bitIndex) -> int`

`bitIndex` is `0..31`, where `0` is the least-significant bit. The result is `0` or `1`.

Example:

```8f4e
includes
include std/bitwise/extractBit
includesEnd

entry test
module extractBitExample
push 0b10100100
push 2
call extractBit
; stack: 1
moduleEnd
entryEnd
```

## `std/bitwise/extractByte`

Provides `extractByte`, which extracts one byte from a 32-bit integer.

Available overloads:

- `extractByte(int word, int byteIndex) -> int`

`byteIndex` is `0..3`, where `0` is the least-significant byte.

Example:

```8f4e
includes
include std/bitwise/extractByte
includesEnd

entry test
module extractByteExample
push 0x12345678
push 1
call extractByte
; stack: 0x56
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
