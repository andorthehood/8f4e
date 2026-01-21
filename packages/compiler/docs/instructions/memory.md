# Memory instructions

For identifier prefixes and suffixes that expand memory identifiers, see [Identifier prefixes](../prefixes.md).

### load

The load instruction consumes an address from the stack and pushes the 32-bit integer value stored at that address.

#### Examples

```
int input 42
push &input
load
```

### load8s

The load8s instruction consumes an address from the stack and loads an 8-bit signed integer from memory, sign-extending it to 32 bits.

#### Examples

```
int8[] buffer 1 -1
push &buffer[0]
load8s
```

### load8u

The load8u instruction consumes an address from the stack and loads an 8-bit unsigned integer from memory, zero-extending it to 32 bits.

#### Examples

```
int8[] buffer 1 127
push &buffer[0]
load8u
```

### load16s

The load16s instruction consumes an address from the stack and loads a 16-bit signed integer from memory, sign-extending it to 32 bits.

#### Examples

```
int16[] buffer 1 -1
push &buffer[0]
load16s
```

### load16u

The load16u instruction consumes an address from the stack and loads a 16-bit unsigned integer from memory, zero-extending it to 32 bits.

#### Examples

```
int16[] buffer 1 32000
push &buffer[0]
load16u
```

### loadFloat

The loadFloat instruction consumes an address from the stack and pushes the 32-bit floating-point value stored at that address.

#### Examples

```
float input 1.25
push &input
loadFloat
```

### store

The store instruction consumes a value and an address from the stack and stores the value at the address.

#### Examples

```
int output
push &output
push 10
store
```

### init

The init instruction sets the default value for a declared memory identifier or buffer element (for example `init bufferName[3] 42`).

#### Examples

```
int value
init value 42
```
