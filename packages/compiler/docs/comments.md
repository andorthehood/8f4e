# Comments

The 8f4e language supports comments using the semicolon marker.

## Semicolon Comments (`;`)

Lines starting with a semicolon are treated as comments and are ignored by the compiler:

```
; This is a comment
int value 42  ; This is also a comment
```

## Hash Symbol (`#`)

The hash symbol (`#`) is **not** treated as a comment marker. It is reserved for future compiler directives and will have special meaning when directive support is added.

If you need to add comments in your code, use the semicolon (`;`) marker.
