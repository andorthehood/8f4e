# Comments

The 8f4e language supports two types of comment markers:

## Semicolon Comments (`;`)

Lines starting with a semicolon are treated as comments and are ignored by the compiler:

```
; This is a comment
int value 42  ; This is also a comment
```

## Hash Comments (`#`)

Lines starting with a hash symbol are also treated as comments by the compiler:

```
# This is a comment
int value 42  # This is also a comment
```

**Note:** The `#` prefix is reserved for future compiler directives. Currently, it behaves identically to `;`, but this may change in future versions when compiler directive support is added.
