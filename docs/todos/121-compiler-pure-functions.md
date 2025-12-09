---
title: 'TODO: Add Pure Function Support to Compiler'
priority: Medium
effort: 5-7d
created: 2025-12-09
status: Open
completed: null
---

# TODO: Add Pure Function Support to Compiler

## Problem Description

- The compiler only accepts modules today; `function`/`functionEnd` tokens are parsed but discarded, so there is no reusable helper construct outside of modules.
- Projects need small stack-only helpers they can call from multiple modules without duplicating code, yet the compiler lacks APIs, metadata, or WASM layout to host them.
- Without pure function support we cannot safely add a `call` instruction, forcing all logic in modules and making optimizations (like deduped math helpers) impossible.

## Proposed Solution

- Extend the compiler entry-point to accept a `functions` array beside `modules`, and return compiled helper metadata (IDs, signatures, indices).
- Define a strict syntax (`function <name> <arg types>` / `functionEnd <return types>`) limited to `int`/`float`, stack-based arguments/returns (max 8 each), locals only, and full access to constants.
- Compile helpers with a `compileFunction` pipeline, forbid memory instructions (load/store/pointer ops), and add a new assembly-level `call <functionId>` instruction that resolves function names to WASM indices.
- Rebuild the WASM sections so helper signatures/bodies occupy stable slots before module loop functions, and wire the new feature into docs/tests.
- Explicitly limit this TODO to the compiler package; updating the editor UI/runtime to consume helpers will be tackled separately.

## Implementation Plan

### Step 1: Extend compiler API and context
- Add `functions?: Module[]` (or similar) parameter to `compile` and flow AST parsing/sorting for functions separately from modules.
- Introduce `FunctionDefinition`/`CompiledFunction`/`FunctionSignature` types, extend `CompilationContext` with a `mode` flag and helper namespace lookup.
- Expected outcome: public API can ingest helper definitions and downstream code can reason about them.

### Step 2: Implement pure-function compilation + call instruction
- Create `compileFunction` paralleling `compileModule`, parse `function`/`functionEnd` lines to collect IDs/signatures, generate locals, and produce WASM bodies.
- Add validation helpers (`isInstructionInsideModuleOrFunction`, purity enforcement) so disallowed instructions throw when `mode === 'function'`.
- Implement a new instruction compiler for `call` that resolves helper names, verifies stack types, and emits the WASM `call` opcode.
- Expected outcome: stack-only helpers compile to deterministic WASM functions and modules can call them.

### Step 3: Integrate helpers into WASM layout + docs/tests
- Insert helper signatures/bodies into the type/function/code sections before module loops; recompute function indices so existing module offsets stay valid.
- Export helper metadata (IDs, signatures, indices) to consumers, document the feature (`README.md`, `AGENTS.md`), and add Vitest coverage for happy-path and rejection cases (illegal memory op, signature overflow, duplicate IDs).
- Expected outcome: new feature is discoverable, validated, and regression-tested.

## Success Criteria

- [ ] `compile` accepts user-defined pure functions and returns their metadata alongside modules.
- [ ] Assembly code can invoke `call <functionId>` and the generated WASM calls the expected helper.
- [ ] Tests cover valid helpers, invalid instructions inside helpers, and module integration cases.

## Affected Components

- `packages/compiler/src/index.ts` – extend API, integrate helper compilation, update WASM layout.
- `packages/compiler/src/compiler.ts` – add `compileFunction`, context updates, metadata handling.
- `packages/compiler/src/instructionCompilers/*` – new `call` instruction, helper-aware validation.
- `docs/AGENTS.md`, package-level `AGENTS.md`, README – document new syntax and API.
- `tests/**/*.ts` – new Vitest coverage for helper compilation and module integration.

## Risks & Considerations

- **Signature/index drift**: Incorrect ordering in type/function sections could break module calls. Mitigation: centralize index assignment and add regression tests.
- **Instruction validation gaps**: Missing purity checks could allow memory ops inside helpers. Mitigation: audit instruction compilers and add helper-only tests.
- **WASM size growth**: Injecting many helpers increases code size slightly; watch for opportunities to dedupe or lazy-load in future iterations.

## Related Items

- **Related**: `docs/brainstorming_notes/016-compiler-pure-functions.md` – full design brainstorm.
- **Related**: `docs/todos/055-strength-reduction-compiler-optimization.md` – future optimization work that could benefit from helper support.

## References

- `docs/brainstorming_notes/016-compiler-pure-functions.md`
- `packages/compiler/src/index.ts`, `packages/compiler/src/compiler.ts`

## Notes

- Function IDs must be unique (global) and are referenced by name in assembly code; the compiler resolves them to WASM indices.
- Types are limited to `int`/`float`; pointer variants imply memory access and will be rejected.
- Maximum of 8 parameters and 8 return values per helper initially; revisit when impure functions are introduced.
