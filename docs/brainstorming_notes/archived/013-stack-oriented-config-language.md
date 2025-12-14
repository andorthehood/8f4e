## Stack Config Language — Minimal Specification

A for-fun, stack-machine-inspired config language designed to accompany 8f4e, itself a stack-oriented programming language.

### 1. Program Structure

- One command per line.
- Each command performs exactly one stack or scope operation.
- Programs execute sequentially; no branches or loops.

### 2. Runtime State

- `config` — the mutable root object being constructed
- `dataStack` — LIFO stack of values
- `scopeStack` — stack of scope **segments** (strings)

`currentScope = scopeStack.join(".")` (or `""` if `scopeStack` is empty)

### 3. Commands

#### `push <literal>`

Push a literal onto `dataStack`.  
Literals may be: string, number, boolean, or null.

Example:

```txt
push "hello"
push 123
push true
push null
```

Stack effect:

```txt
(... -- ... literal)
```

#### `set`

Pop one or more values and store them into `config` at the current scoped path.

Stack before:

```txt
(... value)                 ; single value
(... v1 v2 ... vn)         ; multiple values
```

Process:

1. Pop one or more values from the stack (implementation decides grouping).  
   - If exactly one value is popped, `value = v1`.  
   - If multiple values are popped, `value = [v1, v2, ... , vn]`.
2. Use the current scope path as the target location.
3. Create intermediary objects/arrays if needed.
4. Assign the value at that location.

Stack after:

```txt
(...)
```

Example (simple object field):

```txt
scope "name"
push "Piano"
set
```

Resulting `config`:

```json
{
  "name": "Piano"
}
```

Example (nested via scope):

```txt
scope "icons.piano.color"
push "blue"
set
```

Resulting `config`:

```json
{
  "icons": {
    "piano": {
      "color": "blue"
    }
  }
}
```

#### `append`

Append one or more values to an array at the scoped path.

Stack before:

```txt
(... value)             ; single value
(... v1 v2 ... vn)     ; multiple values
```

Process:

1. Pop one or more values from the stack (implementation decides grouping).  
   - If exactly one value is popped, append that value.  
   - If multiple values are popped, append each of them in order.
2. Use the current scope path as the target location.
3. Resolve the value at that location:
   - if missing → create `[]`
   - if exists but not array → error
4. Append the popped value(s).

Example:

```txt
scope "channels"
push "left"
push "right"
set

push "center"
push "sub"
append
```

Resulting `config`:

```json
{
  "channels": ["left", "right", "center", "sub"]
}
```

#### `concat`

Concatenate all values on the data stack into a single string.

Stack before:

```txt
(... v1 v2 ... vn)     ; one or more values
```

Process:

1. Pop all values from the stack (bottom to top).
2. Convert each value to a string via `String(value)`.
3. Join all string representations with no separator.
4. Push the concatenated string back onto the stack.

Stack after:

```txt
(... concatenated_string)
```

Example:

```txt
scope "greeting"
push "Hello, "
push "World"
push "!"
concat
set
```

Resulting `config`:

```json
{
  "greeting": "Hello, World!"
}
```

Example with type coercion:

```txt
scope "message"
push "Count: "
push 42
push ", active: "
push true
concat
set
```

Resulting `config`:

```json
{
  "message": "Count: 42, active: true"
}
```

#### `scope <path>`

Push one or more new scope segments onto `scopeStack`.

Process:

1. Split `<path>` on `"."` into segments.
2. For each non-empty segment, push it onto `scopeStack`.

Examples:

```txt
; at root (scopeStack = [])
scope "icons"          ; scopeStack = ["icons"]         → currentScope = "icons"
scope "piano"          ; scopeStack = ["icons", "piano"] → currentScope = "icons.piano"

; multi-segment in one go
scope "icons.piano"    ; scopeStack = ["icons", "piano"] → currentScope = "icons.piano"
```

Stack effect: modifies `scopeStack`.

#### `rescopeTop <path>`

Replace the top scope segment on `scopeStack` with a new one derived from it.

Process:

1. Require `scopeStack` to be non-empty (else error).
2. Pop the top segment from `scopeStack`.
3. Split `<path>` on `"."` into segments.
4. For each non-empty segment, push it onto `scopeStack`.

Examples:

```txt
; scopeStack: ["icons", "piano"]       (currentScope = "icons.piano")
rescopeTop "harp"                      ; scopeStack: ["icons", "harp"]       → "icons.harp"

; scopeStack: ["piano"]                (currentScope = "piano")
rescopeTop "harp"                      ; scopeStack: ["harp"]                → "harp"

; scopeStack: ["icons", "piano"]       (currentScope = "icons.piano")
rescopeTop "harp.keys"                 ; scopeStack: ["icons", "harp", "keys"] → "icons.harp.keys"
```

#### `rescope <path>`

Replace the entire current scope with a new one.

Process:

1. Clear `scopeStack`.
2. Split `<path>` on `"."` into segments.
3. For each non-empty segment, push it onto `scopeStack`.

Examples:

```txt
; scopeStack: ["icons", "piano"]       (currentScope = "icons.piano")
rescope "drums.color"                  ; scopeStack: ["drums", "color"]      → "drums.color"

; scopeStack: []                       (no current scope)
rescope "instrument.name"              ; scopeStack: ["instrument", "name"]  → "instrument.name"
```

#### `rescopeSuffix <path>`

Replace the trailing suffix of the current scope with a new suffix.

Process:

1. Split `<path>` on `"."` into segments, resulting in `n` segments.
2. Require `scopeStack.length >= n` (else error).
3. Pop the last `n` segments from `scopeStack`.
4. For each segment from `<path>`, push it onto `scopeStack`.

The number of segments replaced equals the number of segments in the argument path, preserving the unchanged prefix.

Examples:

```txt
; scopeStack: ["icons", "piano", "title"]       (currentScope = "icons.piano.title")
rescopeSuffix "harp.title"                      ; scopeStack: ["icons", "harp", "title"]       → "icons.harp.title"

; scopeStack: ["settings", "runtime", "[0]", "config"]       (currentScope = "settings.runtime[0].config")
rescopeSuffix "runtime[1].config"                            ; scopeStack: ["settings", "runtime", "[1]", "config"]  → "settings.runtime[1].config"

; Error case: insufficient scope depth
; scopeStack: ["foo"]                           (currentScope = "foo")
rescopeSuffix "bar.baz"                         ; ERROR: Cannot rescopeSuffix: scope stack has 1 segment(s), but suffix has 2 segment(s)
```

This is useful for transforming related paths without losing the common prefix, making config programs more composable and readable.

#### `endScope`

Pop a single entry from `scopeStack`.  
Returns to the previous scope.

Example:

```txt
scope "icons"

  scope "piano.color"
  push "blue"
  set
  endScope            ; pop "color"
  endScope            ; pop "piano"

  scope "drums.color"
  push "red"
  set
  endScope            ; pop "color"
  endScope            ; pop "drums"

endScope
```

Resulting `config`:

```json
{
  "icons": {
    "piano": {
      "color": "blue"
    },
    "drums": {
      "color": "red"
    }
  }
}
```

### 4. Path Resolution Rules

Given `currentScope` at the time of `set` or `append`:

- If `currentScope` is non-empty → `fullPath = currentScope`
- Else → `fullPath` refers to the root object (`config` itself).

Examples:

```txt
scope "foo"
scope "bar"              ; currentScope = "foo.bar"

scope "foo.bar[2].x"     ; currentScope = "foo.bar[2].x"

scope "icons.piano.Key"  ; currentScope = "icons.piano.Key"
```

### 5. Path Syntax

Supported path forms:

```txt
"key"
"parent.child"
"arrayKey[0]"
"parent.array[3].child"
```

### 6. Error Conditions

Implementations must error on:

- Writing through an intermediate scalar (type conflict).
- `append` on a non-array value.
- `concat` when `dataStack` is empty.
- Invalid literal syntax.
- `rescopeTop` when `scopeStack` is empty.

Optional (implementation-dependent):

- Unknown command.
- Extra tokens after a command.

### 7. Final Output

After all commands finish executing, `config` contains the constructed object.

Example (end-to-end program):

```txt
scope "instrument.name"
push "Piano"
set

rescopeTop "volume"
push 0.8
set

rescopeTop "tags"
push "keyboard"
push "acoustic"
set
```

Final `config`:

```json
{
  "instrument": {
    "name": "Piano",
    "volume": 0.8,
    "tags": ["keyboard", "acoustic"]
  }
}
```
