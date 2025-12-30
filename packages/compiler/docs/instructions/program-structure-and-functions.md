# Program structure and functions

## Block Instructions

Block instructions define the structure of your program. See detailed documentation in the `blocks/` folder:

- [Module blocks](./blocks/module.md) - `module` and `moduleEnd`
- [Function blocks](./blocks/function.md) - `function`, `param`, and `functionEnd`
- [Constants blocks](./blocks/constants.md) - `constants` and `constantsEnd`

## Other Instructions

### initBlock

The initBlock instruction begins a module initialization block that runs once before the main loop.

#### Examples

```
initBlock
 push 1
initBlockEnd
```

### initBlockEnd

The initBlockEnd instruction ends a module initialization block.

#### Examples

```
initBlock
 push 1
initBlockEnd
```

### call

The call instruction invokes a function by name, consuming its arguments from the stack and pushing its return values.

#### Examples

```
push 2
push 3
call add
```

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

