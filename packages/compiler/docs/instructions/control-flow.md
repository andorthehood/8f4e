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

### mapBegin

The `mapBegin` instruction opens a map block and declares the input type for the mapping operation. The input type must be `int`, `float`, or `float64`.

Between `mapBegin` and `mapEnd` only `map`, `default`, and `mapEnd` are valid instructions.

#### Examples

```
int key
push key
mapBegin int
  map 1 100
  map 2 200
mapEnd int
```

### map

The `map` instruction declares a single key→value row inside a map block. The key is matched against the input value, and if it matches (and no earlier row has already matched), the corresponding value becomes the result.

Key type must match the input type declared in `mapBegin`. Value type is validated against the output type at `mapEnd`.
For `int` maps, single-character string literals are accepted for keys and values and are converted to ASCII integer codes (for example `"A"` → `65`). Multi-character strings are not allowed in `map`.

#### Examples

```
push key
mapBegin int
  map 1 10
  map 2 20
mapEnd int
```

Character-literal usage in an `int` map:

```
push key
mapBegin int
  map "A" "B"
mapEnd int
```

### default

The `default` instruction declares an explicit fallback value inside a map block. It is returned when no `map` key matches the input. If omitted the implicit default is the typed zero (`0`, `0.0`, or `0.0f64` depending on output type).

The default value type must match the output type declared in `mapEnd`.

#### Examples

```
push key
mapBegin int
  map 1 100
  default 999
mapEnd int
```

### mapEnd

The `mapEnd` instruction closes a map block and declares the output type (`int`, `float`, or `float64`). It consumes the input value from the stack and pushes the mapped result.

Lowering uses branchless WebAssembly `select` instructions: each row is evaluated in declaration order with first-match-wins semantics.

> **Note on float key precision**: key matching uses exact equality (`f32.eq` / `f64.eq`). Rounding and precision management is the user's responsibility.

#### Examples

```
int keycode
int output
push &output
push keycode
mapBegin int
  map 65 1
  map 66 2
  map 67 3
  default 0
mapEnd int
store
```

Mixed input/output types:

```
int keycode
float output
push &output
push keycode
mapBegin int
  map 0 0.5
  map 1 1.0
mapEnd float
store
```

### skip

The skip instruction skips execution for a number of iterations. When called without arguments it returns immediately; with a count it skips until the counter reaches the provided value.

#### Examples

```
skip
skip 4
```
