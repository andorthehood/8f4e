# Function Block

## function

The function instruction begins a function block with the provided name.

### Examples

```
function add
param int x
param int y
push x
push y
add
functionEnd int
```

### Usage

Functions are reusable code blocks that:
- Can accept parameters using the `param` instruction
- Can return values (specified in `functionEnd`)
- Can be called from modules or other functions using the `call` instruction
- Can call execution entries using the `call` instruction
- Are pure by default
- Can opt into explicit address-driven memory IO with `#impure`
- Can be exported to the host WebAssembly ABI with `#export` or `#export <exportedName>`
- Can be declared as host-provided WebAssembly imports with `#import <fieldName>`
- Do not have direct access to module memory identifiers by name
- Cannot declare their own memory

### `#impure`

Use `#impure` inside a function to allow explicit memory reads and writes through addresses already on the stack or passed via params/locals.

```
function fillBlepBuffer
#impure
param float* dst
param float* src
param float gain

push dst
push src
loadFloat
push gain
mul
store
functionEnd
```

### `#export`

Use `#export` inside a function to export it from the generated WebAssembly module under the function name.
Use `#export <exportedName>` to provide a different host-visible name.

```
function onMidiCC
#export
param int channel
param int controller
param int value
functionEnd
```

Host code calls exported functions with positional numeric arguments:

```ts
(instance.exports.onMidiCC as CallableFunction)(channel, controller, value);
```

Argument mapping:

- `int` maps to Wasm `i32` and a JavaScript `number`
- `float` maps to Wasm `f32` and a JavaScript `number`
- `float64` maps to Wasm `f64` and a JavaScript `number`

Export names must be unique and must not reuse built-in exports such as `initDefaults` or an execution entry name.
Functions that read from or write to memory still need `#impure`.

### `#import`

Use `#import <fieldName>` inside a function to declare that the function is provided by the WebAssembly host.

```
function hostLog
#import log
param int value
functionEnd
```

Imported functions still declare their signature with `param` and `functionEnd`, and callers use the normal `call` instruction:

```
push 42
call hostLog
```

The host must provide a matching import when instantiating the module:

```ts
await WebAssembly.instantiate(codeBuffer, {
	host: {
		memory,
		log(value: number) {
			console.log(value);
		},
	},
});
```

Use string literals when the WebAssembly import field name is not a plain 8f4e identifier:

```
function addOne
#import "add.one"
param int value
functionEnd int
```

Imported functions cannot contain executable 8f4e body instructions, cannot also use `#export`, and are treated as impure.

Function compiler directives are prologue metadata: place `#impure`, `#export`, `#import`, and `#loopCap` directly after the `function` line and before params, locals, or executable instructions.

### Example Function

```
function calculateDistance
param float x1
param float y1
param float x2
param float y2
local float dx
local float dy

; dx = x2 - x1
push x2
push x1
sub
localSet dx

; dy = y2 - y1
push y2
push y1
sub
localSet dy

; dx * dx
push dx
push dx
mul

; dy * dy
push dy
push dy
mul

; dx*dx + dy*dy
add

; sqrt(dx*dx + dy*dy)
sqrt

functionEnd float
```

## param

The param instruction declares a function parameter (`param int name` or `param float name`). Parameters must be declared before any other function body instructions.

### Examples

```
function double
param int x
push x
push 2
mul
functionEnd int
```

### Notes

- Parameters must be declared immediately after the function declaration
- Parameter names must be unique within the function
- Parameters can be accessed using `push` and modified using `localSet`

## functionEnd

The functionEnd instruction ends a function block and declares the return types (`functionEnd int float`).

### Examples

```
function getFortyTwo
push 42
functionEnd int
```

### Return Values

Functions can return zero or more values:

```
; No return value
function doSomething
; code here
functionEnd

; Single int return
function getNumber
push 42
functionEnd int

; Single float return
function getFloat
push 3.14
functionEnd float

; Multiple returns
function getCoordinates
push 10
push 20
functionEnd int int
```

### Notes

- The stack must match the declared return signature when reaching `functionEnd`
- Return types are specified as space-separated type names after `functionEnd`
