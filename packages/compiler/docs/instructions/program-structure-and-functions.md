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
