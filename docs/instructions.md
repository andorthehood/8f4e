# Instructions

Table of Contents
* [Arithmetic instructions](#arithmetic-instructions)
    * [add](#add)
    * [div](#div)
    * [mul](#mul)
    * [remainder](#remainder)
    * [sub](#sub)
* [Bitwise instructions](#bitwise-instructions)
    * [and](#and)
    * [or](#or)
    * [shiftRight](#shiftright)
    * [shiftRightUnsigned](#shiftrightunsigned)
    * [xor](#xor)
* [Comparison](#comparison)
    * [equalToZero](#equaltozero)
    * [greaterOrEqual](#greaterorequal)
    * [greaterOrEqualUnsigned](#greaterorequalunsigned)
    * [greaterThan](#greaterthan)
    * [lessOrEqual](#lessorequal)
    * [lessThan](#lessthan)
* [Control flow instructions](#control-flow-instructions)
    * [block](#block)
    * [branch](#branch)
    * [branchIfTrue](#branchiftrue)
    * [else](#else)
    * [end](#end)
    * [if](#if)
    * [loop](#loop)
    * [loopEnd](#loopend)
    * [skip](#skip)
* [Conversion](#conversion)
    * [castToFloat](#casttofloat)
    * [castToInt](#casttoint)
* [Memory instructions](#memory-instructions)
    * [load](#load)
* [Other](#other)
    * [const](#const)
    
## Arithmetic instructions

### add

The "add" instruction operates on two numbers of the same type that are retrieved from the stack. It performs addition on these numbers and then stores the result back onto the stack.

#### Examples

    push 1    # stack: [ 1 ]
    push 2    # stack: [ 1, 2 ]
    add       # stack: [ 3 ]

    push 0.5    # stack: [ 3, 0.5 ]
    push 0.7    # stack: [ 3, 0.5, 0.7 ]
    add         # stack: [ 3, 1.2 ]

### div

The "div" instruction retrieves two numbers of the same type from the stack and divides the first number by the second. The resulting quotient is then stored back onto the stack.

### mul

The "mul" instruction retrieves two numbers of the same type from the stack, multiplies them together, and then stores the result back onto the stack.

    push 1    # stack: [ 2 ]
    push 2    # stack: [ 2, 2 ]
    mul       # stack: [ 4 ]

    push 0.5    # stack: [ 4, 0.5 ]
    push 0.7    # stack: [ 4, 0.5, 0.7 ]
    add         # stack: [ 4, 0.35 ]

### remainder

The "remainder" instruction retrieves two integer operands from the stack, divides the first operand by the second operand, and then computes the remainder of this division. It then stores the remainder back onto the stack. 

### sub

The "sub" instruction operates on two numbers of the same type that are retrieved from the stack. It subtracts the second operand from the first operand, and then stores the result back onto the stack.

    push 1    # stack: [ 2 ]
    push 2    # stack: [ 2, 3 ]
    sub       # stack: [ -1 ]

    push 0.5    # stack: [ -1, 0.5 ]
    push 0.7    # stack: [ -1, 0.5, 0.7 ]
    add         # stack: [ -1, -0.2 ]

## Bitwise instructions

### and

The "and" instruction retrieves two integers from the stack and performs a bitwise AND operation on them. Specifically, each bit of the resulting value is computed by performing a logical AND between the corresponding bits of the two operands. The resulting value is then stored back onto the stack. 

    push 0b00001    # stack: [ 0b00001 ]
    push 0b00100    # stack: [ 0b00001, 0b00100 ]
    and             # stack: [ 0b00000 ]

    clearStack

    push 0b00001    # stack [ 0b00001 ]
    push 0b00001    # stack [ 0b00001, 0b00001 ]
    and             # stack [ 0b00001 ]

### or

The "or" instruction retrieves two integers from the stack and performs a bitwise OR operation on them. Specifically, each bit of the resulting value is computed by performing a logical OR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

    push 0b00001    # stack: [ 0b00001 ]
    push 0b00100    # stack: [ 0b00001, 0b00100 ]
    and             # stack: [ 0b00101 ]

    clearStack

    push 0b00001    # stack [ 0b00001 ]
    push 0b00001    # stack [ 0b00001, 0b00001 ]
    and             # stack [ 0b00001 ]

### shiftRight

The "shiftRight" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, and then stores the resulting value back onto the stack. This instruction is typically used to perform bit shifting operations in a program, such as dividing an integer by a power of 2, or extracting specific bits from an integer. Note that if the second operand is greater than or equal to the number of bits in the first operand, the result will be 0.

### shiftRightUnsigned

The "shiftRightUnsigned" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, filling the leftmost bits with zeros, and then stores the resulting value back onto the stack. This instruction is similar to the "shiftRight" instruction, but treats the first operand as an unsigned integer. This means that no sign extension occurs during the shift, and the leftmost bits are always filled with zeros, even if the original leftmost bit was 

### xor

The "xor" instruction retrieves two integers from the stack and performs a bitwise XOR (exclusive OR) operation on them. Specifically, each bit of the resulting value is computed by performing a logical XOR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

## Comparison

### equalToZero

The equalToZero instruction retrieves a value from the stack, verifies if it equals zero, and then pushes a 1 onto the stack if it is true, or 0 if it is false.

### greaterOrEqual

The greaterOrEqual instruction obtains two values from the stack, checks if the first value is greater than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### greaterOrEqualUnsigned

The greaterOrEqualUnsigned instruction retrieves two unsigned values from the stack, checks if the first value is greater than or equal to the second value without considering their signs, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### greaterThan

The greaterThan instruction retrieves two values from the stack, checks if the first value is strictly greater than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### lessOrEqual

The lessOrEqual instruction takes two values from the stack, checks if the first value is less than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### lessThan

The lessThan instruction retrieves two values from the stack, checks if the first value is strictly less than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

## Control flow instructions

### block

### branch

### branchIfTrue

### else

### end

### if

### loop

### loopEnd

### skip

## Conversion

### castToFloat

The castToFloat instruction takes an integer from the stack, converts it to a floating-point number, and then places the resulting value back onto the stack.

### castToInt

The castToInt instruction takes a value from the stack, converts it to an integer, and then places the resulting integer back onto the stack.

## Memory instructions

### load



## Other

### const


