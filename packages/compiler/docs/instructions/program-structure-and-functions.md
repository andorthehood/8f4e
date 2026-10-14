# Program structure and functions

## Block Instructions

Block instructions define the structure of your program. See detailed documentation in the `blocks/` folder:

- [Module blocks](./blocks/module.md) - `module` and `moduleEnd`
- [Function blocks](./blocks/function.md) - `function`, `param`, and `functionEnd`
- [Constants blocks](./blocks/constants.md) - `constants` and `constantsEnd`

## Other Instructions

### expose

Inside a group, `expose <name> &<module>:<memory>` gives a direct child module's memory item a public name:

```8f4e
expose input &processor:input
```

The alias uses the backing declaration's type and allocates no additional memory. Editors derive control types and
connector direction from that declaration: pointers are inputs, and non-pointers are outputs.

### bind

A group contains modules under its own project scope, and an `expose` line gives a module's memory item a public name.
Inside a group, `bind` initializes one of these exposed pointers with the address of memory in the group's immediate
parent project:

```8f4e
entry main
module source
float output 0.5
moduleEnd

group synth
expose input &processor:input
bind &input &source:output

module processor
float* input
push *input
drop
moduleEnd
groupEnd
entryEnd
```

The syntax is `bind &<exposed-pointer> &<module>:<memory>`. The destination name resolves against this group's
exposures. The source module or group name resolves in the immediate parent project; a source group can supply one
of its exposed memory items. For example, a binding inside `audio/synth` resolves `&source:output` to
`audio/source:output`, even if `synth` also contains its own module named `source`.

Binding sources use a single module/group name, without a canonical path or an ancestor search. Each nested group
therefore has the same immediate-parent rule. Both operands must be start-address references to named memory items;
literal addresses, expressions, indexed slots, and end addresses are not accepted.

The destination must expose a scalar pointer declaration. Pointer arrays cannot be bound as a whole. Validation uses
the backing declaration's type.

A binding overrides the backing pointer's declaration default. An unbound pointer keeps its normal default. Two
bindings to the same backing pointer are an error, including when different exposed names target that pointer.

Bindings participate in `initDefaults()` and are ready before any entry's modules execute. They also provide the
source's memory region and pointee element count to pointer analysis. Source declarations remain unchanged, and a
binding allocates no additional memory.

`bind` is valid only at group level. Root project scope, entry scope, and module/function bodies cannot contain bindings.

### call

The call instruction invokes a function by name, consuming its arguments from the stack and pushing its return values.

#### Examples

```
push 2
push 3
call add
```

Inline call arguments are emitted as `push` instructions immediately before the call:

```
call add 2 3
```

This is equivalent to the previous example. Inline arguments use normal `push` semantics, so literals, constants, locals, memory identifiers, pointers, and strings behave the same as if each value had been written on its own `push` line.

Calls can target 8f4e-defined functions, host-provided imported functions, or execution entries.

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
