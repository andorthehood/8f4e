# Memory instructions

For identifier prefixes and suffixes that expand memory identifiers, see [Identifier prefixes](../prefixes.md).

In functions, memory instructions require the `#impure` compiler directive. Even in impure functions, memory access must be address-driven: functions still cannot reference module memory identifiers by name or declare their own memory.

Memory access instructions are non-trapping for out-of-bounds addresses. When the compiler cannot prove that an address is within a safe memory range, it emits a runtime bounds guard. Guarded loads return `0` when the address is out of bounds, and guarded stores skip the write.

### load

The load instruction consumes an address from the stack and pushes the 32-bit integer value stored at that address.
If the address is out of bounds, it pushes `0` instead of trapping.

#### Examples

```
int input 42
push &input
load
```

### load8s

The load8s instruction consumes an address from the stack and loads an 8-bit signed integer from memory, sign-extending it to 32 bits.
If the address is out of bounds, it pushes `0` instead of trapping.

#### Examples

```
int8[] buffer 1 -1
push &buffer[0]
load8s
```

### load8u

The load8u instruction consumes an address from the stack and loads an 8-bit unsigned integer from memory, zero-extending it to 32 bits.
If the address is out of bounds, it pushes `0` instead of trapping.

#### Examples

```
int8[] buffer 1 127
push &buffer[0]
load8u
```

### load16s

The load16s instruction consumes an address from the stack and loads a 16-bit signed integer from memory, sign-extending it to 32 bits.
If the address is out of bounds, it pushes `0` instead of trapping.

#### Examples

```
int16[] buffer 1 -1
push &buffer[0]
load16s
```

### load16u

The load16u instruction consumes an address from the stack and loads a 16-bit unsigned integer from memory, zero-extending it to 32 bits.
If the address is out of bounds, it pushes `0` instead of trapping.

#### Examples

```
int16[] buffer 1 32000
push &buffer[0]
load16u
```

### loadFloat

The loadFloat instruction consumes an address from the stack and pushes the 32-bit floating-point value stored at that address.
If the address is out of bounds, it pushes `0.0` instead of trapping.

#### Examples

```
float input 1.25
push &input
loadFloat
```

### store

The store instruction consumes a value and an address from the stack and stores the value at the address.
If the address is out of bounds, the write is skipped instead of trapping.

#### Examples

```
int output
push &output
push 10
store
```

### init

The init instruction sets the default value for a declared memory identifier or buffer element (for example `init bufferName[3] 42`).
The value argument can also be a constant expression with exactly one operator (`CONST+number`, `CONST-number`, `CONST*number`, or `CONST/number`).

#### Examples

```
const SIZE 8
int value
init value SIZE/2
```

### storeBytes

The storeBytes instruction pops a destination address from the top of the stack, then pops `N` byte values and writes them contiguously to memory in pop order (first pop → `dst + 0`). Each value is truncated to a byte before storing.
Out-of-bounds byte writes are skipped instead of trapping. If only part of the range is in bounds, the in-bounds bytes are still written and the out-of-bounds bytes are skipped.

Stack layout before call: `... , byte1 , byte2 , ... , byteN , dstAddress`

#### Examples

```
int8[] buffer 8
push 72
push 101
push 108
push 108
push 111
push &buffer
storeBytes 5
```
