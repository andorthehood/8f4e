# @8f4e/sub-program

Internal compiler orchestration package. It is available only through the `@8f4e/sub-program/internal` subpath used by
`@8f4e/compiler`; project-facing consumers use `parseProjectSource` and `compileProject` from the compiler facade.

The package consumes the canonical `ProjectObjectModel` after include resolution and runs the private compilation passes
that produce emission-ready module, function, and memory artifacts. No separate source-level sub-program contract is
exposed.

Its private emission handoff contains indexes and memory addresses assigned within one unit. Composing multiple compiled
units into one WebAssembly module will require relocation metadata; until that exists, composition should happen before
final binary emission.
