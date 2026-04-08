---
title: 'TODO: Add configurable loop cap directive and loop override'
priority: Medium
effort: 4-8h
created: 2026-04-03
status: Completed
completed: 2026-04-08
---

# TODO: Add configurable loop cap directive and loop override

## Problem Description

The compiler currently injects infinite-loop protection into every `loop`, but the cap is hardcoded to `1000`.

Current behavior:
- [packages/compiler/src/instructionCompilers/loop.ts](packages/compiler/src/instructionCompilers/loop.ts) emits a hidden local counter for every `loop`
- the generated code compares that counter against `1000`
- when the cap is reached, the compiler writes the source line number into the internal `__loopErrorSignaler` resource and breaks out of the loop

Why this is a problem:
- there is no source-level way to raise or lower the cap for programs with legitimate long-running loops
- users cannot tune the cap globally within a module or function
- users cannot override the cap for one specific loop without changing compiler code
- the current hardcoded value is invisible from source, so loop behavior is less explicit than it should be

## Proposed Solution

Add two source-level configuration paths for loop caps:

1. `#loopCap <int>` sets the default loop cap for subsequent loops in the current compilation block.
2. `loop <int>` overrides the default cap for that specific loop only.

Default behavior:
- if no directive or per-loop argument is present, keep the existing default cap of `1000`

Scope and semantics:
- allow `#loopCap <int>` inside `module` blocks and pure `function` blocks
- reject `#loopCap` in `constants` blocks or at unsupported top-level positions
- make `#loopCap` affect subsequent loops in the current enclosing compilation context
- make `loop <int>` apply only to the loop where the argument appears
- make `loop` with no argument continue to work unchanged

Value rules:
- require a non-negative integer literal for both `#loopCap <int>` and `loop <int>`
- `0` is valid and means the guarded loop exits immediately on the first guard check
- non-literal or negative values belong to syntax validation, not semantic validation

Examples:

```txt
module demo
#loopCap 5000

loop
  ; uses 5000
loopEnd

loop 32
  ; uses 32
loopEnd
moduleEnd
```

```txt
function slowPath int
#loopCap 2048

loop
  ; uses 2048
loopEnd
functionEnd int
```

## Anti-Patterns

- Do not make `#loopCap` a whole-program compile option only; the goal is source-level control.
- Do not make `#loopCap` mutate the currently open loop from inside the loop body.
- Do not require a separate semantic backpatch pass just to attach a cap to a loop when `loop <int>` can express loop-local intent directly.
- Do not change existing `loop` source without an argument to mean something different from today.
- Do not use compiler errors for invalid numeric shape that tokenizer syntax rules can reject earlier.

## Implementation Plan

### Step 1: Extend syntax support for directive and loop argument
- Add tokenizer argument validation for `#loopCap <non-negative integer literal>`.
- Update `loop` validation so it accepts zero or one non-negative integer literal argument.
- Add or extend typed AST exports so compiler code can refer to the directive and optional loop-argument shape without broad casts.

### Step 2: Add directive-owned compilation state
- Add a loop-cap field to `CompilationContext` with a default value of `1000`.
- Implement a new `#loopCap` instruction compiler that:
  - validates context as module-or-function scoped
  - updates the current context default loop cap
  - emits no runtime bytecode
- Register the directive in the compiler instruction table.

### Step 3: Teach `loop` to resolve the effective cap
- Update [packages/compiler/src/instructionCompilers/loop.ts](packages/compiler/src/instructionCompilers/loop.ts) to:
  - read the explicit loop argument when present
  - otherwise read the current default from `CompilationContext`
  - otherwise fall back to `1000`
- Keep the existing hidden counter and `__loopErrorSignaler` behavior unchanged apart from the cap source.

### Step 4: Add tests for syntax, scope, and runtime behavior
- Add tokenizer tests for:
  - valid `#loopCap 123`
  - invalid negative or non-literal forms
  - valid `loop`
  - valid `loop 123`
  - invalid `loop foo` or `loop -1`
- Add compiler directive tests for:
  - module-scoped `#loopCap`
  - function-scoped `#loopCap`
  - invalid use in `constants`
  - “subsequent loops only” behavior
- Add runtime/compiler tests proving:
  - plain `loop` still stops at `1000`
  - `#loopCap 500` changes the default loop cap
  - `loop 12` overrides the current default for that loop only
  - nested loops resolve their own explicit or inherited caps correctly

### Step 5: Document the new source forms
- Update compiler directive docs to document `#loopCap`.
- Update control-flow docs to document optional `loop <int>`.
- Clarify the interaction between the ambient default and the per-loop override.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "#loopCap|loop <int>|loopCap" packages/compiler`

## Success Criteria

- [ ] `#loopCap <int>` is accepted in `module` and `function` blocks and rejected elsewhere.
- [ ] `loop` accepts an optional non-negative integer literal argument.
- [ ] `loop` without an argument preserves the current default behavior of `1000`.
- [ ] `#loopCap` changes the default cap for subsequent loops in the current block.
- [ ] `loop <int>` overrides the ambient default for that loop only.
- [ ] Syntax-only invalid forms fail in tokenizer validation.
- [ ] Documentation explains both forms and their precedence.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/validateInstructionArguments.ts` - syntax validation for `#loopCap` and optional `loop` argument
- `packages/compiler/packages/tokenizer/src/types.ts` - typed AST support for the new directive and optional loop argument
- `packages/compiler/src/types.ts` - compilation-context storage for the current loop cap
- `packages/compiler/src/instructionCompilers/loop.ts` - effective-cap resolution in emitted loop guard code
- `packages/compiler/src/instructionCompilers/index.ts` - directive registration
- `packages/compiler/src/instructionCompilers/` - new `#loopCap` compiler directive implementation
- `packages/compiler/tests/` - directive and loop-behavior coverage
- `packages/compiler/docs/directives.md` - directive documentation
- `packages/compiler/docs/instructions/control-flow.md` - `loop <int>` documentation

## Risks & Considerations

- **Scope confusion**: `#loopCap` is not truly whole-program global; it is an ambient default within the current module or function context. Docs should say this explicitly.
- **Ordering semantics**: because compilation is single-pass, `#loopCap` should affect subsequent loops only. Retroactive behavior would require more complexity and would be harder to reason about.
- **Nested-loop behavior**: tests should make it explicit how inherited defaults and explicit overrides interact in nested control flow.
- **Typed AST drift**: if tokenizer and compiler typed line contracts are updated inconsistently, downstream casts will reappear.

## Related Items

- **Related**: `docs/todos/231-add-init-only-compiler-directive.md`
- **Related**: `docs/todos/217-add-first-compiler-directive-skip-module-execution.md`
- **Related**: `docs/todos/343-move-arity-and-raw-argument-shape-validation-into-tokenizer.md`
- **Related**: `docs/todos/345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md`

## Notes

- This spec intentionally avoids adding a JS `CompileOptions` loop-cap setting for now. If a project-wide host option is needed later, it can be layered on top as an initial default without replacing the source-level forms.
- The preferred precedence order is:
  1. explicit `loop <int>`
  2. current ambient `#loopCap <int>`
  3. built-in fallback `1000`
