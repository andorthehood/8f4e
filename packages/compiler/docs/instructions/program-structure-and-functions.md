# Program structure and functions

### module

The module instruction begins a module block with the provided name.

#### Examples

```
module demo
moduleEnd
```

### moduleEnd

The moduleEnd instruction ends a module block.

#### Examples

```
module demo
moduleEnd
```

### function

The function instruction begins a function block with the provided name.

#### Examples

```
function add
param int x
param int y
localGet x
localGet y
add
functionEnd int
```

### param

The param instruction declares a function parameter (`param int name` or `param float name`). Parameters must be declared before any other function body instructions.

#### Examples

```
function double
param int x
localGet x
push 2
mul
functionEnd int
```

### functionEnd

The functionEnd instruction ends a function block and declares the return types (`functionEnd int float`).

#### Examples

```
function getFortyTwo
push 42
functionEnd int
```

### initBlock

The initBlock instruction begins a module initialization block that runs once before the main loop.

#### Examples

```
initBlock
 push 1
initBlockEnd
```

### initBlockEnd

The initBlockEnd instruction ends a module initialization block.

#### Examples

```
initBlock
 push 1
initBlockEnd
```

### call

The call instruction invokes a function by name, consuming its arguments from the stack and pushing its return values.

#### Examples

```
push 2
push 3
call add
```

### use

The use instruction imports constants from another namespace into the current one.

#### Examples

```
use math
push TAU
```

### constants

The constants instruction begins a constants block with the provided name. Constants blocks can only contain `const` declarations and must be defined at the top level (outside of modules and functions).

#### Examples

```
constants math
const PI 3.14159
const TAU 6.28318
constantsEnd
```

### constantsEnd

The constantsEnd instruction ends a constants block.

#### Examples

```
constants physics
const GRAVITY 9.81
const SPEED_OF_LIGHT 299792458
constantsEnd
```

#### Usage with modules

Constants from a constants block can be imported into modules using the `use` instruction:

```
constants math
const PI 3.14159
const TAU 6.28318
constantsEnd

module circleCalc
use math
int radius 5
float circumference 0.0
push circumference
push radius
castToFloat
push TAU
mul
store
moduleEnd
```

#### Last-wins semantics

When multiple namespaces are used, constants with the same name are resolved using last-applied wins semantics:

```
constants first
const VALUE 10
constantsEnd

constants second
const VALUE 20
constantsEnd

module example
use first
use second
; VALUE will be 20 (from second namespace)
moduleEnd
```

#### Name conflicts

Constants blocks and modules cannot share the same name - the compiler will produce an error if there is a naming conflict.
