# Identifier prefixes and metadata queries

8f4e supports a small set of identifier prefixes/suffixes that expand memory identifiers into derived values, and function-style metadata queries.

## Memory reference

- `&name` pushes the start address (byte address) of the memory item.
- `name&` pushes the start address (byte address) of the last word-aligned chunk covering the memory item (i.e., the base address of the final 4-byte word of the allocation).
- `&this` pushes the start byte address of the current module.
- `this&` pushes the end-word base byte address of the current module.

These work in both `push` instructions and declaration initializers (e.g., `int* ptr &buffer` or `int* endPtr buffer&`) with the same address semantics.

Examples:

```
int value 1
push &value

int8[] buffer 4 0
push &buffer[0]

int* moduleStart &this
int* moduleEnd this&

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
- Only valid for pointer identifiers (`int*`, `int8*`, `int16*`, `float*`, `float64*`, etc.).
- Using `sizeof(*name)` on a non-pointer identifier produces a compiler error.

Examples:

| Declaration         | `sizeof(name)` | `sizeof(*name)` |
|---------------------|----------------|-----------------|
| `int* ptr`          | 4              | 4               |
| `int8* ptr`         | 4              | 1               |
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
- Only valid for pointer identifiers (`int*`, `int8*`, `int16*`, `float*`, `float64*`, etc.).
- Using `max(*name)` on a non-pointer identifier produces a compiler error.
- `max(name)` keeps its existing meaning (max of the memory item's own element type).

Examples:

| Declaration         | `max(name)`         | `max(*name)`                       |
|---------------------|---------------------|------------------------------------|
| `int* ptr`          | 2,147,483,647       | 2,147,483,647                      |
| `int8* ptr`         | 2,147,483,647       | 127                                |
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

---

## Compile-time arithmetic expressions

Compile-time expressions combine two compile-time-resolvable operands with a single arithmetic operator.
They are evaluated at compile time and produce a constant value; they do not generate any runtime instructions.

Supported operators:

| Operator | Meaning        | Example       |
|----------|----------------|---------------|
| `*`      | Multiplication | `SIZE*2`      |
| `/`      | Division       | `SIZE/2`      |
| `^`      | Exponentiation | `2^16`        |

Each side can be a numeric literal, a constant name, or a metadata query such as `sizeof(name)` or `count(name)`.
Exactly one operator is allowed; chained forms like `2^3^4` or `SIZE*2/4` are not valid.

**Note**: `^` means exponentiation in compile-time expressions, not bitwise XOR (which is the runtime `xor` instruction).

Examples:

```
const WIDTH  2^16          ; 65536
const TOTAL  SIZE^2        ; SIZE squared
const BYTES  sizeof(buf)^2 ; element word size squared
const HALF   SIZE/2        ; integer or float division
const DOUBLE SIZE*2        ; multiplication

int[] buffer SIZE^2        ; allocate SIZE² elements
push 2^EXP                 ; push 2 raised to EXP
```

All of the address and metadata forms above have intermodular counterparts that reference memory declared in a different module. The module name and the memory name (or index) are separated by a colon.

### Module base address

- `&module:` — start byte address of the module's memory region.
- `module:&` — end-word base byte address of the module's memory region (base address of the last 4-byte word in the allocation).

```
module targetModule
int* start &sourceModule:
int* end   sourceModule:&
moduleEnd
```

### Named memory item address

- `&module:name` — start byte address of a named memory item in another module.
- `module:name&` — end-word base byte address of a named memory item in another module.

```
module targetModule
int* ptr    &sourceModule:buffer
int* endPtr sourceModule:buffer&
moduleEnd
```

### Nth memory item address

- `&module:N` — start byte address of the Nth memory item (0-indexed, by declaration order) within another module.

`&module:0` is equivalent to `&module:` — both resolve to the module's base address. Each subsequent index N steps to the next declared memory item regardless of its size.

```
module sourceModule
int  a 0      ; item 0
int  b 0      ; item 1
int[] c 10 0  ; item 2 — the whole array counts as one slot
moduleEnd

module targetModule
int* ptrA &sourceModule:0   ; same as &sourceModule:a
int* ptrB &sourceModule:1   ; same as &sourceModule:b
int* ptrC &sourceModule:2   ; same as &sourceModule:c
moduleEnd
```

### Intermodular metadata queries

The `count`, `sizeof`, `max`, and `min` queries all accept a `module:name` pair:

- `count(module:name)` — element count of a memory item in another module.
- `sizeof(module:name)` — element word size (bytes) of a memory item in another module.
- `max(module:name)` — maximum finite value for the element type of a memory item in another module.
- `min(module:name)` — minimum finite value for the element type of a memory item in another module.

```
module targetModule
push count(sourceModule:buffer)
push sizeof(sourceModule:buffer)
push max(sourceModule:buffer)
push min(sourceModule:buffer)
moduleEnd
```
