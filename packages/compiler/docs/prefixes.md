# Identifier prefixes

8f4e supports a small set of identifier prefixes and suffixes that expand memory identifiers into derived values.

## Memory reference

- `&name` pushes the start address (byte address) of the memory item.
- `name&` pushes the last byte address of the memory item.

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
