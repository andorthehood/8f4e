# Function Block

## function

The function instruction begins a function block with the provided name.

### Examples

```
function add
param int x
param int y
localGet x
localGet y
add
functionEnd int
```

### Usage

Functions are reusable code blocks that:
- Can accept parameters using the `param` instruction
- Can return values (specified in `functionEnd`)
- Can be called from modules using the `call` instruction
- Do not have access to module memory (they are pure functions)

### Example Function

```
function calculateDistance
param float x1
param float y1
param float x2
param float y2

; dx = x2 - x1
localGet x2
localGet x1
sub

; dy = y2 - y1
localGet y2
localGet y1
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
localGet x
push 2
mul
functionEnd int
```

### Notes

- Parameters must be declared immediately after the function declaration
- Parameter names must be unique within the function
- Parameters can be accessed using `localGet` and modified using `localSet`

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
