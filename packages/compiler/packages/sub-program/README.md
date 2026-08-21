# @8f4e/sub-program

Compiles one atomic, closed 8f4e source unit into emission-ready module, function, and memory artifacts.

A sub-program owns its entries, modules, functions, constants, prototypes, namespace, and memory layout. All references
resolve within that boundary. A future program composer can assign identities to multiple sub-programs and link them
through explicit imports and exports.

The current `CompiledSubProgram` contract contains indexes and memory addresses assigned within one unit. Composing
multiple compiled units into one WebAssembly module will require relocation metadata; until that exists, composition
should happen before final binary emission.
