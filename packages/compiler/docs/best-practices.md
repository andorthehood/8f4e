# 8f4e Best Practices

Practical patterns for writing predictable, efficient 8f4e modules.

## Derive Buffer Facts From Prefixes

Avoid duplicating buffer metadata in separate variables.

- Use `$buffer` for element count.
- Use `%buffer` for element word size.
- Use `buffer&` (or inter-module `&module.buffer&`) for end address.

This keeps modules resilient when buffer declarations change.

Bad:
```text
int[] rhythm 16
int steps 16
; ...logic uses `steps` everywhere...
```

Good:
```text
int[] rhythm 16
; ...logic uses `$rhythm` for step count...
```

## Prefer Address-Based Walking

When stepping through buffers, prefer a byte offset (or pointer-like state) instead of an element index that repeatedly needs address recomputation via `index * %buffer`.

In other words, this replaces:
- element-index walking (`_index` as element number)
- repeated address math on every access/wrap check (`buffer + _index * %buffer`)

With:
- address/offset walking (`_offset` in bytes)
- direct address math (`buffer + _offset`) and `_offset += %buffer`

- Fewer operations in hot loops.
- No repeated `index * %buffer` multiplications for wrap checks.

Bad:
```text
int _index
push bufferIn
push _index
push %bufferIn
mul
add
load
```

Good:
```text
int _offset
push bufferIn
push _offset
add
load
```

## Emit Pulses Explicitly

If the module should output triggers (not gates), write output low by default each cycle, then set it to `1` only on the trigger edge when the current step is active.

This guarantees one-cycle pulses even for consecutive `1` values in the pattern.

Bad (gate-like behavior):
```text
; out stays high if source stays high
push &out
push currentStepValue
store
```

Good (pulse behavior):
```text
push &out
push 0
store

push *trigger
risingEdge
if void
 ; only pulse on edge and active step
 push stepValue
 if void
  push &out
  push 1
  store
 ifEnd
ifEnd
```

## Keep Internal State Private-Style

Use `_`-prefixed names for internal counters/accumulators (for example `_index`, `_bucket`, `_offset`).

This makes intent clear and avoids confusion with externally wired memory items.

Bad:
```text
int index
int bucket
int beat
```

Good:
```text
int _index
int _bucket
int _beat
```

## Compose Small Modules

Prefer single-responsibility modules and compose behavior by wiring outputs to inputs.

Small focused modules are easier to test, reuse, and rewire in projects.

Bad:
```text
module megaSequencer
; generation + rotation + trigger sequencing + output packing
moduleEnd
```

Good:
```text
module source
; produce data
moduleEnd

module transformer
; transform data from source
moduleEnd

module sink
; consume transformed data
moduleEnd
```

## Guard Only What You Need

If project wiring guarantees valid ranges, avoid extra defensive guards in hot code paths.

If guards are required, keep them explicit and narrow to the failure mode that would cause incorrect control flow (especially non-terminating loops).

Bad:
```text
; repeated defensive checks every cycle
push *trigger
risingEdge
if void
 push *lengthIn
 push 0
 lessOrEqual
 if void
  push &_index
  push 0
  store
 else
  push _index
  push *lengthIn
  greaterOrEqual
  if void
   push &_index
   push 0
   store
  ifEnd
  ; ...real work...
 ifEnd
ifEnd
```

Good:
```text
; wiring guarantees valid range, so hot path stays lean
push *trigger
risingEdge
if void
 ; ...real work...

 push &_offset
 push _offset
 push %bufferIn
 add
 store

 ; single wrap condition to keep loop/sequence bounded
 push bufferIn
 push _offset
 add
 push *bufferEndIn
 greaterThan
 if void
  push &_offset
  push 0
  store
 ifEnd
ifEnd
```
