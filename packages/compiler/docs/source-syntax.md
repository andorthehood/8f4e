# Source syntax

## Argument Continuation Lines

Use `- <argument>` to append one argument to the previous instruction. This is parser sugar; the compiler sees the same instruction it would have seen if the arguments had been written on one line.

```8f4e
float*
- readHead
- &source:samples
```

is equivalent to:

```8f4e
float* readHead &source:samples
```

Each continuation line accepts exactly one argument. A bare `-`, a continuation with multiple arguments, or a continuation without a previous instruction is a syntax error.
