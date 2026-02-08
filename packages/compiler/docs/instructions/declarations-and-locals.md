# Declarations and locals

### const

The const instruction declares a constant value that can be referenced elsewhere in the program.

#### Examples

```
const MAX 120
int output
push &output
push MAX
store
```

### int

The int instruction declares a 32-bit integer in module memory. Use `int*` or `int**` to declare pointer types.

Default values can be specified as literals, constants, or memory references (using `&name` for start address or `name&` for end address).

#### Examples

```
int count 4
int* ptr &count
int* endPtr count&
```

### float

The float instruction declares a 32-bit floating-point value in module memory. Use `float*` or `float**` to declare pointer types.

Default values can be specified as literals, constants, or memory references (using `&name` for start address or `name&` for end address).

#### Examples

```
float gain 0.75
float[] samples 4 0.0
float* ptr &samples
float* endPtr samples&
```

### int[]

The int[] instruction declares a buffer of integers in module memory. Variants include `int8[]`, `int8u[]`, `int16[]`, `int16u[]`, `int32[]`, `int*[]`, and `int**[]`.

Unsigned variants (`int8u[]`, `int16u[]`) interpret values as unsigned integers (0-255 for int8u, 0-65535 for int16u) in debuggers, plotters, and when using min/max prefixes.

#### Examples

```
int[] values 4 0
int8u[] unsignedBytes 256
int16u[] unsignedShorts 128
```

### float[]

The float[] instruction declares a buffer of floating-point values in module memory. Variants include `float*[]` and `float**[]`.

#### Examples

```
float[] samples 4 0.0
```

### local

The local instruction declares a local variable inside a module or function (`local int name` or `local float name`).

#### Examples

```
local int temp
```

### localGet

The localGet instruction pushes the value of a local variable onto the stack.

#### Examples

```
local int temp
push 5
localSet temp
localGet temp
```

### localSet

The localSet instruction consumes a value from the stack and stores it in a local variable.

#### Examples

```
local int temp
push 5
localSet temp
```
