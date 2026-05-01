# Signal helpers

### risingEdge

The risingEdge instruction returns 1 when the current value is greater than the previous value, otherwise 0. Supports `int` and `float`.

#### Examples

```
push 1
risingEdge
```

### fallingEdge

The fallingEdge instruction returns 1 when the current value is less than the previous value, otherwise 0. Supports `int` and `float`.

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
