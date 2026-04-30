# Arithmetic instructions

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

### clamp

The "clamp" instruction retrieves three numbers of the same type from the stack: a value, a minimum, and a maximum. It stores the value constrained to the inclusive minimum/maximum range back onto the stack.

#### Examples

```
push 12
push 0
push 10
clamp     ; stack: [ 10 ]

push -0.5
push 0.0
push 1.0
clamp     ; stack: [ 0.0 ]
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

### min

The "min" instruction retrieves two numbers of the same type from the stack and stores the smaller value back onto the stack.

#### Examples

```
push 10
push 3
min       ; stack: [ 3 ]

push 0.5
push 0.7
min       ; stack: [ 0.5 ]
```

### max

The "max" instruction retrieves two numbers of the same type from the stack and stores the larger value back onto the stack.

#### Examples

```
push 10
push 3
max       ; stack: [ 10 ]

push 0.5
push 0.7
max       ; stack: [ 0.7 ]
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
