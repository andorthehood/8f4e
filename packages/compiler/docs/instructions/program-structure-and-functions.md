# Program structure and functions

## Block Instructions

Block instructions define the structure of your program. See detailed documentation in the `blocks/` folder:

- [Module blocks](./blocks/module.md) - `module` and `moduleEnd`
- [Function blocks](./blocks/function.md) - `function`, `param`, and `functionEnd`
- [Constants blocks](./blocks/constants.md) - `constants` and `constantsEnd`
- [Macro blocks](./blocks/macros.md) - `defineMacro`, `defineMacroEnd`, and `macro`

## Other Instructions

### call

The call instruction invokes a function by name, consuming its arguments from the stack and pushing its return values.

#### Examples

```
push 2
push 3
call add
```

Calls can target either 8f4e-defined functions or host-provided imported functions.

### Imported functions

Imported functions use the normal function block shape, with a `#import` directive in the function prologue:

```8f4e
function hostLog
#import log
param int value
functionEnd
```

The signature is declared with `param` and `functionEnd`, then calls work like any other function:

```8f4e
module main
push 42
call hostLog
moduleEnd
```

At instantiation time, the host must provide the matching WebAssembly import:

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

Imported functions can return values:

```8f4e
function addOne
#import "add.one"
param int value
functionEnd int

module main
push 41
call addOne
; stack now contains 42
moduleEnd
```

Only directives, `param`, and `functionEnd` are allowed in imported functions. They cannot contain executable 8f4e instructions because their implementation is supplied by the host.

See [Compiler directives](../directives.md#import) for the full `#import` rules and error cases.

### use

The use instruction imports constants from another namespace into the current one.

#### Examples

```
use math
push TAU
```

#### Notes

- Constants can be imported from both constants blocks and modules
- Multiple `use` statements can be used in sequence
- When the same constant name exists in multiple namespaces, the last `use` statement wins
