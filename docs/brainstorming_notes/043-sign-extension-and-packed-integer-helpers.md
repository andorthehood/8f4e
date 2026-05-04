# Sign Extension and Packed Integer Helpers

Date: 2026-05-04

This note captures a small possible language feature: explicit sign-extension helpers for packed integer workflows.

## Short version

8f4e already supports narrow integer memory access with instructions such as `load8s`, `load16s`, `load8u`, and `load16u`.

Those instructions are useful when the value comes directly from memory. They do not help when a byte or halfword has already been extracted onto the stack through bitwise operations.

WebAssembly has direct sign-extension instructions for this:

- `i32.extend8_s`
- `i32.extend16_s`

8f4e could expose these as small stack helpers:

```8f4e
signExtend8
signExtend16
```

## Why this is useful

Packed data often stores several small fields inside one integer or byte buffer:

- packed pixel formats
- sprite attributes
- MIDI or serial-style byte protocols
- audio sample formats
- compact asset metadata
- bitfield-heavy control data

When a signed 8-bit or 16-bit field is loaded directly from memory, `load8s` or `load16s` already does the right thing.

But if the value is extracted from a larger packed value, users need a way to say:

> Treat the low 8 or 16 bits of this `i32` as signed, then convert it back to a normal signed `i32`.

## Example

Suppose an integer contains several packed byte fields and one field is signed:

```8f4e
; packed contains several byte fields.
push packed
push 8
shiftRight
push 255
and
signExtend8
```

Without `signExtend8`, users have to emulate this with comparisons and subtraction:

```8f4e
; x is 0..255
dup
push 127
greaterThan
if int
	push 256
	sub
ifEnd
```

That is much noisier than the operation it represents.

## Semantics

`signExtend8`:

- consumes one integer stack value
- takes the low 8 bits
- interprets those bits as a signed 8-bit integer
- pushes the sign-extended `i32`

Examples:

```text
0x0000007f -> 127
0x00000080 -> -128
0x000000ff -> -1
```

`signExtend16`:

- consumes one integer stack value
- takes the low 16 bits
- interprets those bits as a signed 16-bit integer
- pushes the sign-extended `i32`

Examples:

```text
0x00007fff -> 32767
0x00008000 -> -32768
0x0000ffff -> -1
```

The result is still a normal 8f4e integer stack value.

## Possible instruction names

Most direct:

```8f4e
signExtend8
signExtend16
```

Shorter, but less obvious:

```8f4e
sx8
sx16
```

More type-like:

```8f4e
asInt8
asInt16
```

The direct names are probably clearest for documentation and searchability.

## Zero extension

Unsigned extension is already easy to express with masks:

```8f4e
push 255
and
```

```8f4e
push 65535
and
```

So `zeroExtend8` and `zeroExtend16` are less important than the signed forms.

They might still be useful aliases if the language wants symmetry, but they should not be required for the first pass.

## Compiler shape

This would be a small compiler addition:

- add Wasm opcodes for `i32.extend8_s` and `i32.extend16_s` to wasm-utils
- add unary instruction compilers for `signExtend8` and `signExtend16`
- validate that the operand is an integer
- pop one integer stack item and push one integer stack item
- document the instructions in the bitwise or conversion docs
- add edge-case tests for `0x7f`, `0x80`, `0xff`, `0x7fff`, `0x8000`, and `0xffff`

Because the operation is pure stack arithmetic, it should not interact with memory safety or runtime initialization.

## Relationship to narrow memory types

This feature complements existing narrow memory support:

- `load8s` / `load16s` sign-extend values while loading from memory
- `signExtend8` / `signExtend16` sign-extend values already on the stack
- `load8u` / `load16u` plus `signExtend8` / `signExtend16` can make unsigned loading plus later signed reinterpretation explicit

It also pairs with `int8*` and `int16*` pointer metadata, because pointer dereference can already load signed narrow values directly. The new helpers cover the other path: extracted packed fields that are not loaded through a narrow pointer.

## Main takeaway

This is not a large language feature.

It is a small primitive that makes packed integer code clearer and cheaper. If 8f4e grows more byte-oriented assets, protocol, pixel, or audio workflows, explicit sign-extension helpers would keep that code readable while mapping directly to efficient WebAssembly instructions.
