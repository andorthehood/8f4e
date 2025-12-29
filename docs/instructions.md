# Instructions

* [Arithmetic instructions](#arithmetic-instructions)
    * [add](#add)
    * [div](#div)
    * [mul](#mul)
    * [remainder](#remainder)
    * [sub](#sub)
* [Bitwise instructions](#bitwise-instructions)
    * [and](#and)
    * [or](#or)
    * [shiftLeft](#shiftleft)
    * [shiftRight](#shiftright)
    * [shiftRightUnsigned](#shiftrightunsigned)
    * [xor](#xor)
* [Comparison](#comparison)
    * [equal](#equal)
    * [equalToZero](#equaltozero)
    * [greaterOrEqual](#greaterorequal)
    * [greaterOrEqualUnsigned](#greaterorequalunsigned)
    * [greaterThan](#greaterthan)
    * [lessOrEqual](#lessorequal)
    * [lessThan](#lessthan)
* [Control flow instructions](#control-flow-instructions)
    * [block](#block)
    * [blockEnd](#blockend)
    * [branch](#branch)
    * [branchIfTrue](#branchiftrue)
    * [branchIfUnchanged](#branchifunchanged)
    * [else](#else)
    * [if](#if)
    * [ifEnd](#ifend)
    * [loop](#loop)
    * [loopEnd](#loopend)
    * [skip](#skip)
* [Conversion](#conversion)
    * [castToFloat](#casttofloat)
    * [castToInt](#casttoint)
* [Stack instructions](#stack-instructions)
    * [push](#push)
    * [drop](#drop)
    * [dup](#dup)
    * [swap](#swap)
    * [clearStack](#clearstack)
* [Memory instructions](#memory-instructions)
    * [load](#load)
    * [load8s](#load8s)
    * [load8u](#load8u)
    * [load16s](#load16s)
    * [load16u](#load16u)
    * [loadFloat](#loadfloat)
    * [store](#store)
    * [init](#init)
* [Declarations and locals](#declarations-and-locals)
    * [const](#const)
    * [int](#int)
    * [float](#float)
    * [int[]](#int-1)
    * [float[]](#float-1)
    * [local](#local)
    * [localGet](#localget)
    * [localSet](#localset)
* [Program structure and functions](#program-structure-and-functions)
    * [module](#module)
    * [moduleEnd](#moduleend)
    * [function](#function)
    * [param](#param)
    * [functionEnd](#functionend)
    * [initBlock](#initblock)
    * [initBlockEnd](#initblockend)
    * [call](#call)
    * [use](#use)
* [Math helpers](#math-helpers)
    * [abs](#abs)
    * [pow2](#pow2)
    * [sqrt](#sqrt)
    * [round](#round)
    * [ensureNonZero](#ensurenonzero)
* [Signal helpers](#signal-helpers)
    * [risingEdge](#risingedge)
    * [fallingEdge](#fallingedge)
    * [hasChanged](#haschanged)
    * [cycle](#cycle)
* [Low-level](#low-level)
    * [wasm](#wasm)
    
## Arithmetic instructions

### add

The "add" instruction operates on two numbers of the same type that are retrieved from the stack. It performs addition on these numbers and then stores the result back onto the stack.

#### Examples

```
push 1    ; stack: [ 1 ]
push 2    ; stack: [ 1, 2 ]
add       ; stack: [ 3 ]

push 0.5    ; stack: [ 3, 0.5 ]
push 0.7    ; stack: [ 3, 0.5, 0.7 ]
add         ; stack: [ 3, 1.2 ]
```

### div

The "div" instruction retrieves two numbers of the same type from the stack and divides the first number by the second. The resulting quotient is then stored back onto the stack.

#### Examples

```
push 8
push 2
div

push 9.0
push 3.0
div
```

### mul

The "mul" instruction retrieves two numbers of the same type from the stack, multiplies them together, and then stores the result back onto the stack.

#### Examples

```
push 1    ; stack: [ 2 ]
push 2    ; stack: [ 2, 2 ]
mul       ; stack: [ 4 ]

push 0.5    ; stack: [ 4, 0.5 ]
push 0.7    ; stack: [ 4, 0.5, 0.7 ]
add         ; stack: [ 4, 0.35 ]
```

### remainder

The "remainder" instruction retrieves two integer operands from the stack, divides the first operand by the second operand, and then computes the remainder of this division. It then stores the remainder back onto the stack. 

#### Examples

```
push 10
push 3
remainder
```

### sub

The "sub" instruction operates on two numbers of the same type that are retrieved from the stack. It subtracts the second operand from the first operand, and then stores the result back onto the stack.

#### Examples

```
push 1    ; stack: [ 2 ]
push 2    ; stack: [ 2, 3 ]
sub       ; stack: [ -1 ]

push 0.5    ; stack: [ -1, 0.5 ]
push 0.7    ; stack: [ -1, 0.5, 0.7 ]
add         ; stack: [ -1, -0.2 ]
```

## Bitwise instructions

### and

The "and" instruction retrieves two integers from the stack and performs a bitwise AND operation on them. Specifically, each bit of the resulting value is computed by performing a logical AND between the corresponding bits of the two operands. The resulting value is then stored back onto the stack. 

#### Examples

```
push 0b00001    ; stack: [ 0b00001 ]
push 0b00100    ; stack: [ 0b00001, 0b00100 ]
and             ; stack: [ 0b00000 ]
```

```
push 0b00001    ; stack [ 0b00001 ]
push 0b00001    ; stack [ 0b00001, 0b00001 ]
and             ; stack [ 0b00001 ]
```

### or

The "or" instruction retrieves two integers from the stack and performs a bitwise OR operation on them. Specifically, each bit of the resulting value is computed by performing a logical OR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

#### Examples

```
push 0b00001    ; stack: [ 0b00001 ]
push 0b00100    ; stack: [ 0b00001, 0b00100 ]
or              ; stack: [ 0b00101 ]
```

```
push 0b00001    ; stack [ 0b00001 ]
push 0b00001    ; stack [ 0b00001, 0b00001 ]
or              ; stack [ 0b00001 ]
```

### shiftLeft

The "shiftLeft" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the left by the number of positions specified by the second operand, and then stores the resulting value back onto the stack.

#### Examples

```
push 1
push 3
shiftLeft
```

### shiftRight

The "shiftRight" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, and then stores the resulting value back onto the stack. This instruction is typically used to perform bit shifting operations in a program, such as dividing an integer by a power of 2, or extracting specific bits from an integer. Note that if the second operand is greater than or equal to the number of bits in the first operand, the result will be 0.

#### Examples

```
push 16
push 2
shiftRight
```

### shiftRightUnsigned

The "shiftRightUnsigned" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, filling the leftmost bits with zeros, and then stores the resulting value back onto the stack. This instruction is similar to the "shiftRight" instruction, but treats the first operand as an unsigned integer. This means that no sign extension occurs during the shift, and the leftmost bits are always filled with zeros, even if the original leftmost bit was 1.

#### Examples

```
push 0b10000000
push 1
shiftRightUnsigned
```

### xor

The "xor" instruction retrieves two integers from the stack and performs a bitwise XOR (exclusive OR) operation on them. Specifically, each bit of the resulting value is computed by performing a logical XOR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

#### Examples

```
push 0b0101
push 0b0011
xor
```

## Comparison

### equal

The equal instruction retrieves two values from the stack, checks if they are equal, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 5
push 5
equal
```

### equalToZero

The equalToZero instruction retrieves a value from the stack, verifies if it equals zero, and then pushes a 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 0
equalToZero
```

### greaterOrEqual

The greaterOrEqual instruction obtains two values from the stack, checks if the first value is greater than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 5
push 4
greaterOrEqual
```

### greaterOrEqualUnsigned

The greaterOrEqualUnsigned instruction retrieves two unsigned values from the stack, checks if the first value is greater than or equal to the second value without considering their signs, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 0b1111
push 0b0111
greaterOrEqualUnsigned
```

### greaterThan

The greaterThan instruction retrieves two values from the stack, checks if the first value is strictly greater than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 5
push 4
greaterThan
```

### lessOrEqual

The lessOrEqual instruction takes two values from the stack, checks if the first value is less than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 4
push 4
lessOrEqual
```

### lessThan

The lessThan instruction retrieves two values from the stack, checks if the first value is strictly less than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

#### Examples

```
push 3
push 4
lessThan
```

## Control flow instructions

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

## Conversion

### castToFloat

The castToFloat instruction takes an integer from the stack, converts it to a floating-point number, and then places the resulting value back onto the stack.

#### Examples

```
push 3
castToFloat
```

### castToInt

The castToInt instruction takes a value from the stack, converts it to an integer, and then places the resulting integer back onto the stack.

#### Examples

```
push 3.7
castToInt
```

## Stack instructions

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

## Memory instructions

### load

The load instruction consumes an address from the stack and pushes the 32-bit integer value stored at that address.

#### Examples

```
int input 42
push &input
load
```

### load8s

The load8s instruction consumes an address from the stack and loads an 8-bit signed integer from memory, sign-extending it to 32 bits.

#### Examples

```
int8[] buffer 1 -1
push &buffer[0]
load8s
```

### load8u

The load8u instruction consumes an address from the stack and loads an 8-bit unsigned integer from memory, zero-extending it to 32 bits.

#### Examples

```
int8[] buffer 1 127
push &buffer[0]
load8u
```

### load16s

The load16s instruction consumes an address from the stack and loads a 16-bit signed integer from memory, sign-extending it to 32 bits.

#### Examples

```
int16[] buffer 1 -1
push &buffer[0]
load16s
```

### load16u

The load16u instruction consumes an address from the stack and loads a 16-bit unsigned integer from memory, zero-extending it to 32 bits.

#### Examples

```
int16[] buffer 1 32000
push &buffer[0]
load16u
```

### loadFloat

The loadFloat instruction consumes an address from the stack and pushes the 32-bit floating-point value stored at that address.

#### Examples

```
float input 1.25
push &input
loadFloat
```

### store

The store instruction consumes a value and an address from the stack and stores the value at the address.

#### Examples

```
int output
push &output
push 10
store
```

### init

The init instruction sets the default value for a declared memory identifier or buffer element (for example `init bufferName[3] 42`).

#### Examples

```
int value
init value 42
```

## Declarations and locals

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

#### Examples

```
int count 4
```

### float

The float instruction declares a 32-bit floating-point value in module memory. Use `float*` or `float**` to declare pointer types.

#### Examples

```
float gain 0.75
```

### int[]

The int[] instruction declares a buffer of integers in module memory. Variants include `int8[]`, `int16[]`, `int32[]`, `int*[]`, and `int**[]`.

#### Examples

```
int[] values 4 0
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

## Program structure and functions

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

## Math helpers

### abs

The abs instruction computes the absolute value of an integer or floating-point value.

#### Examples

```
push -5
abs
```

### pow2

The pow2 instruction computes 2 raised to the power of an integer exponent.

#### Examples

```
push 3
pow2
```

### sqrt

The sqrt instruction computes the square root of a floating-point value.

#### Examples

```
push 9.0
sqrt
```

### round

The round instruction rounds a floating-point value to the nearest integer-valued float.

#### Examples

```
push 2.7
round
```

### ensureNonZero

The ensureNonZero instruction ensures a value is non-zero, replacing zero with a provided default (or 1/1.0).

#### Examples

```
push 0
ensureNonZero
```

## Signal helpers

### risingEdge

The risingEdge instruction returns 1 when the current integer value is greater than the previous value, otherwise 0.

#### Examples

```
push 1
risingEdge
```

### fallingEdge

The fallingEdge instruction returns 1 when the current integer value is less than the previous value, otherwise 0.

#### Examples

```
push 1
fallingEdge
```

### hasChanged

The hasChanged instruction returns 1 when the current value differs from the previous value, otherwise 0.

#### Examples

```
push 1
hasChanged
```

### cycle

The cycle instruction increments a pointer by one word and wraps it to a start address when it exceeds the end address.

#### Examples

```
int[] buffer 4 0
int* ptr &buffer
push &ptr
push &buffer[0]
push &buffer[3]
cycle
```

## Low-level

### wasm

The wasm instruction emits a raw WebAssembly opcode by numeric value.

#### Examples

```
wasm 26
```
