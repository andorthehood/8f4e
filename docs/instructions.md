# Instructions

## Arithmetic instructions

### add

The add instruction operates on two numbers of the same type that are retrieved from the stack. It performs addition on these numbers and then stores the result back onto the stack.

### div

The div instruction retrieves two numbers of the same type from the stack and divides the first number by the second. The resulting quotient is then stored back onto the stack.

## Bitwise instructions

### and

The and instruction retrieves two integers from the stack and performs a bitwise and operation on them. The resulting value is then stored back onto the stack.

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

## Conversion

### castToFloat

The castToFloat instruction takes an integer from the stack, converts it to a floating-point number, and then places the resulting value back onto the stack.

### castToInt

The castToInt instruction takes a value from the stack, converts it to an integer, and then places the resulting integer back onto the stack.

## Other

### const


