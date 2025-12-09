# Plan: Introduce pure custom functions to the compiler

Goals
- Let projects supply small reusable helpers that mirror modules syntactically but are guaranteed to be pure (locals only, no memory access).
- Compile those helpers once, emit their signatures and indices, and make them callable from module code via a new `call` instruction.

Current state
- `compile` (`packages/compiler/src/index.ts:223-285`) only accepts modules. The commented-out `astFunctions` hint shows functions were considered but never wired in.
- We parse the `function`/`functionEnd` tokens, yet they just push/pop a block marker without producing bytecode or metadata (`packages/compiler/src/instructionCompilers/function*.ts`).
- No place to store function IDs, signatures, or locals. The assembler also lacks a `call foo` instruction that resolves helpers to a WASM index.

Proposed approach
- **API & types**: Extend the compiler entry point so callers can pass `functions` next to `modules`. Add `FunctionDefinition`/`CompiledFunction` interfaces so we return `{ id, signature, body, locals, ast? }` info for the generated helpers.
- **Signature syntax**: Adopt `function <name> <argType1> <argType2> ...` to declare ordered inputs, and `functionEnd <returnType1> <returnType2> ...` for outputs. These tokens give us deterministic WASM type vectors (arity inferred from the number of trailing type tokens). Types are limited to `int` and `float` to avoid implying forbidden memory access, and both parameter and return arity will be capped at 8 for now. Zero-result helpers will emit `functionEnd` with no types.
- **Compilation pipeline**: Mirror `compileModule` with `compileFunction`. Reuse the instruction set but run in a “function” mode where the namespace exposes constants (built-in + module-provided) and locals but no memory. Parse the opening `function` line to capture the helper’s name and signature, and ensure the stack is empty at `functionEnd`.
- **Purity enforcement**: Thread a `context.mode` (or similar flag) through instruction compilers. Memory-oriented instructions (`memory`, `load*`, `store*`, pointer helpers, `store`, etc.) must throw when invoked while `mode === 'function'`. Introduce helpers such as `isInstructionInsideModuleOrFunction` alongside the existing `isInstructionIsInsideAModule` so each opcode can declare where it’s valid. Helpers only shuffle stack values and locals; no memory IO until future “impure” support exists.
- **Namespaces & linking**: Track compiled functions in a lookup (`context.namespace.functions`) so modules can reference them. Introduce a new assembly instruction (e.g., `call foo`) that resolves the helper’s globally-unique name, emits WASM `call` with the assigned index, and records stack type effects per signature.
- **WASM layout**: Place user-defined functions into the type/function/code sections ahead of module loops/memory initializers. Remove the hard-coded `+3` offsets at `packages/compiler/src/index.ts:242-245` by calculating base indices dynamically so module code can call helpers reliably.
- **Metadata export**: Surface each helper’s signature and index to the caller (and potentially to the module compiler) so validation and tooling can reason about them the same way they do modules.
- **Testing & docs**: Add Vitest coverage for compiling pure helpers, calling them from modules, and rejection cases (illegal memory access, missing signatures). Update `AGENTS.md`/README once the public API changes.
- **Editor integration (out of scope for now)**: Focus this effort on `@8f4e/compiler` only; editor/runtime changes to surface or invoke helpers can follow once the compiler API stabilizes.
