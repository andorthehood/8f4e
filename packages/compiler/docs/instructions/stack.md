# Stack instructions

### push

The push instruction pushes a literal, constant, local, memory value, or address onto the stack.
For identifier prefixes and suffixes that expand memory identifiers, see [Identifier prefixes](../prefixes.md).

Float64 literals use the `f64` suffix; unsuffixed float literals default to float32.

A quoted string literal is expanded at compile time into one `i32.const` per byte (in source order).
Supported escape sequences: `\"`, `\\`, `\n`, `\r`, `\t`, `\xNN`.

#### Examples

```
push 1
push 2.5
push 3.14f64
push 1e-10f64
push "hello"
push "line1\nline2"
push "\x41\x42"
```

### drop

The drop instruction removes the top value from the stack.

#### Examples

```
push 1
drop
```

### dup

The dup instruction duplicates the top value on the stack.

#### Examples

```
push 5
dup
```

### swap

The swap instruction swaps the top two values on the stack.

#### Examples

```
push 1
push 2
swap
```

### clearStack

The clearStack instruction removes all values from the stack.

#### Examples

```
push 1
push 2
clearStack
```
