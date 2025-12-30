# Module Block

## module

The module instruction begins a module block with the provided name.

### Examples

```
module demo
moduleEnd
```

### Usage

Modules are the primary unit of code organization in 8f4e. Each module:
- Must have a unique name
- Can contain memory declarations, constants, and executable code
- Has its own namespace that can be imported by other modules using `use`

### Example Module

```
module oscillator
const FREQUENCY 440.0
float phase 0.0
float increment 0.0

; Calculate phase increment
push increment
push FREQUENCY
push SAMPLE_RATE
castToFloat
div
store

; Update phase
push phase
push phase
load
push increment
load
add
store
moduleEnd
```

## moduleEnd

The moduleEnd instruction ends a module block.

### Examples

```
module demo
moduleEnd
```

### Notes

- Every `module` instruction must have a corresponding `moduleEnd`
- Code outside of module blocks is not allowed (except config and constants blocks)
