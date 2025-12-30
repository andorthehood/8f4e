# Constants Block

## constants

The constants instruction begins a constants block with the provided name. Constants blocks can only contain `const` declarations and must be defined at the top level (outside of modules and functions).

### Examples

```
constants math
const PI 3.14159
const TAU 6.28318
constantsEnd
```

### Usage

Constants blocks provide a way to organize related constants into named namespaces:
- Must be defined at the top level (not inside modules or functions)
- Can only contain `const` declarations
- Must have a unique name
- Can be imported into modules using `use`

### Example Constants Block

```
constants audioConstants
const SAMPLE_RATE 48000
const BUFFER_SIZE 128
const MAX_CHANNELS 2
constantsEnd

module audio
use audioConstants
; Now PI, TAU, and other constants from math namespace are available
float samplePosition 0.0
moduleEnd
```

## constantsEnd

The constantsEnd instruction ends a constants block.

### Examples

```
constants physics
const GRAVITY 9.81
const SPEED_OF_LIGHT 299792458
constantsEnd
```

## Usage with Modules

Constants from a constants block can be imported into modules using the `use` instruction:

```
constants math
const PI 3.14159
const TAU 6.28318
constantsEnd

module circleCalc
use math
int radius 5
float circumference 0.0
push circumference
push radius
castToFloat
push TAU
mul
store
moduleEnd
```

## Last-Wins Semantics

When multiple namespaces are used, constants with the same name are resolved using last-applied wins semantics:

```
constants first
const VALUE 10
constantsEnd

constants second
const VALUE 20
constantsEnd

module example
use first
use second
; VALUE will be 20 (from second namespace)
moduleEnd
```

## Notes

- Constants blocks cannot be nested inside other blocks
- Constants blocks provide namespace isolation for constants
- Multiple constants blocks can be defined in a project
- Constants defined in modules can also be imported using `use`
