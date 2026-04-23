# Function Block

## function

The function instruction begins a function block with the provided name.

### Examples

```
function add
param int x
param int y
push x
push y
add
functionEnd int
```

### Usage

Functions are reusable code blocks that:
- Can accept parameters using the `param` instruction
- Can return values (specified in `functionEnd`)
- Can be called from modules using the `call` instruction
- Are pure by default
- Can opt into explicit address-driven memory IO with `#impure`
- Do not have direct access to module memory identifiers by name
- Cannot declare their own memory

### `#impure`

Use `#impure` inside a function to allow explicit memory reads and writes through addresses already on the stack or passed via params/locals.

```
function fillBlepBuffer
#impure
param float* dst
param float* src
param float gain

push dst
push src
loadFloat
push gain
mul
store
functionEnd
```

### Example Function

```
function calculateDistance
param float x1
param float y1
param float x2
param float y2

; dx = x2 - x1
push x2
push x1
sub

; dy = y2 - y1
push y2
push y1
sub

; dx * dx
dup
mul

; dy * dy
swap
dup
mul

; dx*dx + dy*dy
add

; sqrt(dx*dx + dy*dy)
sqrt

functionEnd float
```

## param

The param instruction declares a function parameter (`param int name` or `param float name`). Parameters must be declared before any other function body instructions.

### Examples

```
function double
param int x
push x
push 2
mul
functionEnd int
```

### Notes

- Parameters must be declared immediately after the function declaration
- Parameter names must be unique within the function
- Parameters can be accessed using `push` and modified using `localSet`

## functionEnd

The functionEnd instruction ends a function block and declares the return types (`functionEnd int float`).

### Examples

```
function getFortyTwo
push 42
functionEnd int
```

### Return Values

Functions can return zero or more values:

```
; No return value
function doSomething
; code here
functionEnd

; Single int return
function getNumber
push 42
functionEnd int

; Single float return
function getFloat
push 3.14
functionEnd float

; Multiple returns
function getCoordinates
push 10
push 20
functionEnd int int
```

### Notes

- The stack must match the declared return signature when reaching `functionEnd`
- Return types are specified as space-separated type names after `functionEnd`
