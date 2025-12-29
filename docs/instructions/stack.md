# Stack instructions

### push

The push instruction pushes a literal, constant, local, memory value, or address onto the stack.

#### Examples

```
push 1
push 2.5
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
