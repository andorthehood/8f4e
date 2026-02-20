# Conversion

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

### castToFloat64

The castToFloat64 instruction converts the top stack value to a 64-bit floating-point number.

- If the input is `int`, it converts to float64.
- If the input is `float` (float32), it promotes to float64.
- If the input is already float64, it is left unchanged.

#### Examples

```
push 3
castToFloat64
```

```
push 3.14
castToFloat64
```
