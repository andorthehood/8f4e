# Declarations and locals

### const

The const instruction declares a constant value that can be referenced elsewhere in the program.

The right-hand side can also be a constant mul/div expression with exactly one operator:
- `CONST*number`
- `CONST/number`

Rules:
- Left-hand side must be an existing constant identifier.
- Right-hand side must be a numeric literal.
- Only one `*` or `/` operator is allowed per expression.

#### Examples

```
const MAX 120
const HALF_MAX MAX/2
const DOUBLE_MAX MAX*2
int output
push &output
push MAX
store
```

### int

The int instruction declares a 32-bit integer in module memory. Use `int*` or `int**` to declare pointer types.

Anonymous scalar declarations are supported in three forms:
- **Bare implicit zero**: `int` allocates an anonymous `int` with default `0`
- **Anonymous literal/value**: `int 42` allocates an anonymous `int` with default `42`
- **Anonymous constant-style identifier**: `int FOO` allocates an anonymous `int` with default equal to constant `FOO`, where `FOO` is a declared `const`

This bare zero-initialized form applies to scalar declarations only (including pointer variants such as `int*`). Array declarations (`int[]`) still require an element count.

Default values can be specified as literals, constants, or memory references (using `&name` for start address or `name&` for end address).
Constant mul/div expressions are also supported with the same one-operator rule (`CONST*number` or `CONST/number`).

A default value may also be expressed as a split-byte sequence: two to four adjacent byte-resolving tokens combined into a single 32-bit integer.
Bytes are combined left-to-right as most-significant to least-significant.
Missing trailing bytes are padded with `0` on the right to fill the 32-bit width.

Split-byte tokens may be:
- Integer literals in any numeric form (decimal `32`, hexadecimal `0x20`, etc.) as long as each resolves to an integer in the range `0–255`.
- Literal-only `*` or `/` expressions such as `16*2` or `0x40/2`, as long as each folds to an integer in the range `0–255`.
- Constants that resolve at compile time to an integer in the range `0–255`.
- Mixed sequences of byte literals and byte-valued constants are also accepted.

Non-byte-resolving forms are rejected in split-byte mode. Examples:
- `1/2` is rejected because it folds to a non-integer value.
- `16*20` is rejected because it folds to `320`, which is outside the byte range.

A single byte literal or a single byte-valued constant does **not** trigger split-byte mode; only two or more consecutive byte-resolving tokens are treated as a split-byte sequence.

#### Reserved identifier rule

Memory allocation identifiers must **not** match constant-style naming conventions (all-uppercase, no lowercase letters). Constant-style names like `HI`, `MY_VALUE`, or `THRESHOLD` are reserved for `const` declarations. Attempting to use them as memory names is a compiler error.

This rule applies consistently regardless of how many arguments follow:
- `int MY_VAR` → error: constant-style name not declared as a constant
- `int MY_VAR 0` → error: constant-style name used in split-byte position is not a declared constant

When a constant-style identifier appears as the first argument and is declared as a constant, it is treated as an anonymous allocation:
- `int HI` → anonymous allocation, default = constant `HI`
- `int HI LO` → anonymous split-byte allocation, default = `HI` and `LO` packed left-to-right

#### Examples

```
const MAX 8
const HI 0xA8
const LO 0xFF
int
int count 4
int halfCount MAX/2
int*
int* ptr &count
int* endPtr count&
int colorARGB 0xA8 0xFF 0x00 0x00
int colorAR   0xA8 0xFF
int 0xA8 0xFF
int colorDecimal 32 64
int colorExpr 16*2 0x40/2
int 32 64
int 32
int colorFromConst HI LO
int HI LO
```

### int8*

The `int8*` and `int8**` instructions declare pointer types whose pointee is a signed 8-bit integer.

The pointer slot itself occupies 4 bytes (one word), identical to `int*` in allocation width. The pointee width is 1 byte.

Dereferencing with `push *name` emits a signed 8-bit load (`i32.load8_s`), which sign-extends the 8-bit value to a 32-bit integer on the stack.

Pointer-aware metadata reflects the 1-byte pointee width:
- `%*name` returns `1` for `int8*` (pointee element word size)

#### Examples

```
int8[] samples 64 0
int8* ptr &samples
push *ptr        ; loads a signed 8-bit value, sign-extended to i32

int8** pptr &ptr
push *pptr       ; fully dereferences the double pointer

push %*ptr       ; 1 — pointee element word size
```

### int16*

The `int16*` and `int16**` instructions declare pointer types whose pointee is a signed 16-bit integer.

The pointer slot itself occupies 4 bytes (one word), identical to `int*` in allocation width. The pointee width is 2 bytes.

Dereferencing with `push *name` emits a signed 16-bit load (`i32.load16_s`), which sign-extends the 16-bit value to a 32-bit integer on the stack.

Pointer-aware metadata reflects the 2-byte pointee width:
- `%*name` returns `2` for `int16*` (pointee element word size)

#### Examples

```
int16[] samples 64 0
int16* ptr &samples
push *ptr        ; loads a signed 16-bit value, sign-extended to i32

int16** pptr &ptr
push *pptr       ; fully dereferences the double pointer

push %*ptr       ; 2 — pointee element word size
```

### float

The float instruction declares a 32-bit floating-point value in module memory. Use `float*` or `float**` to declare pointer types.

A bare `float` (no arguments) allocates an anonymous `float` with default `0`. This zero-initialized form applies to scalar declarations only (including pointer variants such as `float*`).

Default values can be specified as literals, constants, or memory references (using `&name` for start address or `name&` for end address).
Constant mul/div expressions are also supported with the same one-operator rule (`CONST*number` or `CONST/number`).

#### Examples

```
const MAX_GAIN 2
float
float gain 0.75
float halfGain MAX_GAIN/2
float[] samples 4 0.0
float*
float* ptr &samples
float* endPtr samples&
```

### int[]

The int[] instruction declares a buffer of integers in module memory. Variants include `int8[]`, `int8u[]`, `int16[]`, `int16u[]`, `int32[]`, `int*[]`, and `int**[]`.

Unsigned variants (`int8u[]`, `int16u[]`) interpret values as unsigned integers (0-255 for int8u, 0-65535 for int16u) in debuggers, plotters, and when using min/max prefixes.
Buffer size arguments also support constant mul/div expressions with exactly one operator (`CONST*number` or `CONST/number`).

#### Examples

```
int[] values 4 0
int[] halfValues SIZE/2
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
`push <local>` is also a supported form and is fully equivalent to `localGet <local>` in all cases,
including `float64` locals. See [push](stack.md#push) for the identifier-resolution rule.

#### Examples

```
local int temp
push 5
localSet temp
localGet temp   ; equivalent to: push temp
```

### localSet

The localSet instruction consumes a value from the stack and stores it in a local variable.

#### Examples

```
local int temp
push 5
localSet temp
```
