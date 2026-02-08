# Identifier prefixes

8f4e supports a small set of identifier prefixes and suffixes that expand memory identifiers into derived values.

## Memory reference

- `&name` pushes the start address (byte address) of the memory item.
- `name&` pushes the start address (byte address) of the last word-aligned chunk covering the memory item (i.e., the base address of the final 4-byte word of the allocation).

These work in both `push` instructions and declaration initializers (e.g., `int* ptr &buffer` or `int* endPtr buffer&`) with the same address semantics.

Examples:

```
int value 1
push &value

int8[] buffer 4 0
push &buffer[0]

```

## Pointer dereference

- `*name` dereferences a pointer memory item and loads the value it points to (via `push`).
- The pointer depth comes from the declared type (`int*`, `float*`, `int**`, `float**`).

Example:

```
int target 123
int* ptr &target
push *ptr
```

## Element count

- `$name` pushes the element count for a buffer (or 1 for scalars).

Example:

```
int[] buffer 4 0
push $buffer
```

## Element word size

- `%name` pushes the element word size (in bytes) for a buffer (or 4 for scalars).

Example:

```
int16[] samples 8 0
push %samples
```

## Element max value

- `^name` pushes the maximum finite value for the element type of a memory item.

For signed integers:
- `int32` / `int` / `int[]`: 2,147,483,647
- `int16` / `int16[]`: 32,767
- `int8` / `int8[]`: 127

For unsigned integers:
- `int8u[]`: 255
- `int16u[]`: 65,535

For floats:
- `float` / `float[]`: 3.4028234663852886e+38 (max finite float32)

Example:

```
int16 value 0
push ^value

int8u[] unsignedBuffer 10 0
push ^unsignedBuffer
```

## Element min value

- `!name` pushes the lowest finite value (most negative) for the element type of a memory item.

For signed integers:
- `int32` / `int` / `int[]`: -2,147,483,648
- `int16` / `int16[]`: -32,768
- `int8` / `int8[]`: -128

For unsigned integers:
- `int8u[]`: 0
- `int16u[]`: 0

For floats:
- `float` / `float[]`: -3.4028234663852886e+38 (lowest finite float32)

Example:

```
int8[] buffer 10 0
push !buffer

int8u[] unsignedBuffer 10 0
push !unsignedBuffer
```
