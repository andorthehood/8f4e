# Control flow instructions

### block

The block instruction starts a new block. It accepts an optional result type (`int`, `float`, or `void`) to declare whether the block must leave a value on the stack.

#### Examples

```
block int
 push 1
blockEnd
```

### blockEnd

The blockEnd instruction ends a block and validates any expected result value for the block.

#### Examples

```
block float
 push 1.25
blockEnd
```

### branch

The branch instruction performs an unconditional branch out of nested blocks. The depth argument indicates how many blocks to exit.

#### Examples

```
block void
 block void
  branch 1
 blockEnd
blockEnd
```

### branchIfTrue

The branchIfTrue instruction consumes an integer value from the stack and branches out of nested blocks if the value is non-zero. The depth argument indicates how many blocks to exit.

#### Examples

```
block void
 block void
  push 1
  branchIfTrue 1
 blockEnd
blockEnd
```

### branchIfUnchanged

The branchIfUnchanged instruction consumes a value, compares it to the previous value seen for this instruction, and branches out of nested blocks if the value has not changed. The depth argument indicates how many blocks to exit.

#### Examples

```
block void
 push 2
 branchIfUnchanged 0
 push 2
 branchIfUnchanged 0
blockEnd
```

### else

The else instruction begins the else branch of the current if block.

#### Examples

```
push 1
if int
 push 10
else
 push 20
ifEnd
```

### if

The if instruction consumes an integer condition from the stack and begins a conditional block. It accepts an optional result type (`int`, `float`, or `void`) to declare whether the block must leave a value on the stack.

#### Examples

```
push 1
if int
 push 1
ifEnd
```

### ifEnd

The ifEnd instruction ends an if or else block and validates any expected result value for the block.

#### Examples

```
push 0
if int
 push 1
else
 push 2
ifEnd
```

### loop

The loop instruction begins a loop block. The loop body repeats until a branch exits the loop.

#### Examples

```
int counter
loop
 push counter
 push 10
 equal
 branchIfTrue 1
loopEnd
```

### loopEnd

The loopEnd instruction ends a loop block and branches back to the start of the loop.

#### Examples

```
loop
 push 1
 branchIfTrue 1
loopEnd
```

### skip

The skip instruction skips execution for a number of iterations. When called without arguments it returns immediately; with a count it skips until the counter reaches the provided value.

#### Examples

```
skip
skip 4
```
