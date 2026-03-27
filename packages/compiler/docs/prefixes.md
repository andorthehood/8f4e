# Identifier prefixes and metadata queries

8f4e supports a small set of identifier prefixes/suffixes that expand memory identifiers into derived values, and function-style metadata queries.

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

- `count(name)` pushes the element count for a buffer (or 1 for scalars).

Example:

```
int[] buffer 4 0
push count(buffer)
```

## Element word size

- `sizeof(name)` pushes the element word size (in bytes) for a buffer (or 4 for scalars).

Example:

```
int16[] samples 8 0
push sizeof(samples)
```

## Pointee element word size

- `sizeof(*name)` pushes the element word size (in bytes) of the value pointed to by a pointer-typed memory item.
- Only valid for pointer identifiers (`int*`, `int16*`, `float*`, `float64*`, etc.).
- Using `sizeof(*name)` on a non-pointer identifier produces a compiler error.

Examples:

| Declaration         | `sizeof(name)` | `sizeof(*name)` |
|---------------------|----------------|-----------------|
| `int* ptr`          | 4              | 4               |
| `int16* ptr`        | 4              | 2               |
| `float* ptr`        | 4              | 4               |
| `float64* ptr`      | 4              | 8               |
| `int** ptr`         | 4              | 4               |

```
int* ptr &someInt
push sizeof(ptr)    ; 4  — size of the pointer slot itself
push sizeof(*ptr)   ; 4  — size of the int it points to

float64* fptr &someFloat64
push sizeof(fptr)   ; 4  — size of the pointer slot itself
push sizeof(*fptr)  ; 8  — size of the float64 it points to
```

## Element max value

- `max(name)` pushes the maximum finite value for the element type of a memory item.

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
push max(value)

int8u[] unsignedBuffer 10 0
push max(unsignedBuffer)
```

## Pointee element max value

- `max(*name)` pushes the maximum finite value for the type pointed to by a pointer-typed memory item.
- Only valid for pointer identifiers (`int*`, `int16*`, `float*`, `float64*`, etc.).
- Using `max(*name)` on a non-pointer identifier produces a compiler error.
- `max(name)` keeps its existing meaning (max of the memory item's own element type).

Examples:

| Declaration         | `max(name)`         | `max(*name)`                       |
|---------------------|---------------------|------------------------------------|
| `int* ptr`          | 2,147,483,647       | 2,147,483,647                      |
| `int16* ptr`        | 2,147,483,647       | 32,767                             |
| `float* ptr`        | 2,147,483,647       | 3.4028234663852886e+38             |
| `float64* ptr`      | 2,147,483,647       | 1.7976931348623157e+308            |

```
int* ptr &someInt
push max(ptr)    ; 2,147,483,647  — max of the pointer slot type (i32)
push max(*ptr)   ; 2,147,483,647  — max of the int it points to

float64* fptr &someFloat64
push max(fptr)   ; 2,147,483,647  — max of the pointer slot type (i32)
push max(*fptr)  ; 1.7976931348623157e+308  — max of the float64 it points to
```

## Element min value

- `min(name)` pushes the lowest finite value (most negative) for the element type of a memory item.

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
push min(buffer)

int8u[] unsignedBuffer 10 0
push min(unsignedBuffer)
```
