---
title: 'TODO: Add explicit group constant passing'
priority: Medium
effort: 1-2d
created: 2026-08-27
issue: null
status: Completed
completed: 2026-08-27
---

# TODO: Add Explicit Group Constant Passing

## Problem Description

Nested project groups currently have no explicit way to receive individual compile-time constants from their
enclosing project. Constant blocks are composed into qualified namespaces, and `use` imports an entire namespace into
one compiler source block. Neither mechanism defines a group boundary contract for a specific value such as
`SAMPLE_RATE`.

Automatically searching ancestor namespaces would make a copied group's dependencies implicit. Importing a complete
constants namespace at the group boundary would expose more values than the group requires and would still leave the
actual per-constant contract unclear. Groups need a small, visible interface that states exactly which compile-time
values cross each parent-to-child boundary.

## Proposed Solution

Give every project/group scope an explicit compile-time constant environment. Add two project-scope instructions:

```8f4e
group synth
pass SAMPLE_RATE
const BLOCK_SIZE 128

module oscillator
; SAMPLE_RATE and BLOCK_SIZE are available here
moduleEnd

groupEnd
```

- `pass SAMPLE_RATE` copies the already resolved `SAMPLE_RATE` value from the immediate parent scope into the child
  group under the same name.
- `const BLOCK_SIZE 128` declares a compile-time constant owned directly by the child group.

Directly owned modules, functions, prototypes, and constants blocks begin constant resolution with their group's
constant environment. A nested group receives none of those constants automatically; it must contain its own
`pass SAMPLE_RATE` declaration. Passing through multiple levels therefore remains explicit at every boundary.

Start with the one-argument, same-name form of `pass`. Do not add renaming until there is a concrete use case. A future
extension could accept `pass PARENT_NAME LOCAL_NAME`, but it is not part of the initial contract.

## Semantic Contract

- `pass` resolves against the immediate parent's group-constant environment.
- The root project uses an empty parent environment, so a root-level `pass NAME` produces the same undefined-parent-
  constant diagnostic as any other missing passed constant.
- A passed constant preserves its resolved numeric value and numeric-kind facts.
- `const` at project/group scope declares a constant in that scope; its value may use constants already available in
  the same scope.
- Directly owned compiler source blocks receive the completed scope environment as their initial constant environment.
- Nested groups do not inherit the environment implicitly.
- Duplicate passed names, duplicate group declarations, and collisions between passed and declared group constants are
  semantic errors.
- A source block must not silently replace a group constant with a block-local declaration or namespace import; define
  these collisions as semantic errors as part of the implementation.
- `pass` does not import a namespace, allocate memory, produce WebAssembly, or introduce runtime state.

## Anti-Patterns

- Do not search ancestors automatically when an unresolved constant is encountered.
- Do not make all parent constants visible to child groups.
- Do not pass an entire constants namespace when only one named value is requested.
- Do not reinterpret group-level `use` as a parent-to-child contract.
- Do not allow constants to cross more than one group boundary from a single `pass` declaration.
- Do not rewrite tokenizer-produced source values to canonical group paths.
- Do not implement `pass` by injecting fabricated `const` lines into module or function ASTs.
- Do not add compatibility aliases or fallback lookup behavior; the project has not been released.

## Implementation Plan

### Step 1: Define Project-Scope Constant Declarations

- Define compiler-owned structured representations for group-level `pass` and `const` declarations.
- Add tokenizer/syntax rules for the exact argument shapes and placement constraints.
- Preserve source line and project/group context for syntax and semantic diagnostics.
- Decide how root project-scope `const` declarations are represented without introducing a second source of truth for
  group wrapper code.

### Step 2: Compose Constant Scope Ownership

- Associate every declaration with its canonical `ProjectGroupPath` during recursive project composition.
- Keep declaration source values unchanged; canonical scope identity belongs in structured compiler metadata.
- Preserve declaration order within a scope while resolving parent scopes before their child scopes.
- Resolve root `pass` declarations against an empty parent environment so they report the named constant as undefined.

### Step 3: Resolve Group Constant Environments

- Add a constant-resolver prepass that builds each scope's environment from its parent environment, explicit `pass`
  declarations, and group-owned `const` declarations.
- Resolve each `pass` against only the immediate parent environment.
- Report missing parent constants and duplicate names at the corresponding group declaration line.
- Make group-owned declarations able to reference earlier passed or declared constants in the same scope.

### Step 4: Seed Existing Block Resolution

- Pass the completed group environment into constant resolution for every directly owned module, function, prototype,
  and constants block.
- Keep the existing fact-report model: resolved values belong in constant-resolution facts rather than rewritten AST
  arguments.
- Define and test collision behavior between group constants, block-local `const` declarations, and namespaces imported
  with `use`.
- Ensure included functions receive the environment of the group into which they were included.

### Step 5: Update Project Actors And Coverage

- Preserve group-level `pass` and `const` lines through text parsing, editor loading, editing, copying, pasting, and
  serialization.
- Add syntax highlighting for `pass` through the central known-instruction contract.
- Add nested project fixtures covering declaration, one-level passing, explicit multi-level forwarding, and failures.
- Verify that changing a parent constant re-resolves unchanged child ASTs and does not return stale cached facts.

## Validation Checkpoints

- `npx nx run @8f4e/language-spec:test`
- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/project-preparser:test`
- `npx nx run @8f4e/program-composer:test`
- `npx nx run @8f4e/constant-resolver:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/editor-state:test`
- `npx nx run-many --target=typecheck --all`

## Success Criteria

- [x] A group can declare a compile-time constant with project-scope `const`.
- [x] A group can copy one same-named constant from its immediate parent with `pass NAME`.
- [x] Directly owned source blocks can resolve the group's passed and declared constants.
- [x] Nested groups receive no constants without their own explicit `pass` declarations.
- [x] Multi-level forwarding requires one visible `pass` at every boundary.
- [x] Missing parent constants and all group-constant name collisions produce source-contextual semantic diagnostics.
- [x] Parent constant changes invalidate or recompute child constant-resolution facts correctly.
- [x] No AST arguments are rewritten and no synthetic source lines are injected.
- [x] Project text and editor round trips preserve group constant contracts.

## Affected Components

- `packages/compiler/packages/language-spec` - define instruction names, structured contracts, and diagnostics.
- `packages/compiler/packages/sub-program/packages/tokenizer` - parse and syntax-check group constant declarations.
- `packages/compiler/packages/project-preparser` - preserve project-scope declarations in the object model.
- `packages/compiler/packages/program-composer` - attach canonical group ownership without resolving values.
- `packages/compiler/packages/sub-program/packages/constant-resolver` - build group environments and seed block resolution.
- `packages/compiler/packages/sub-program` - coordinate group constant resolution before downstream compiler passes.
- `packages/editor/packages/editor-state` - preserve, edit, copy, paste, and serialize the new project instructions.

## Risks & Considerations

- **Source ownership**: The root project currently lacks the same visible wrapper-code representation as nested groups.
  Root project-scope declarations need a deliberate object-model and editor representation rather than a special-case
  side channel.
- **Resolution order**: The composer currently appends child code before parent code. Group constants require a
  parent-before-child scope-resolution pass independent of executable module order.
- **Collision policy**: Group constants seed existing per-block environments. Collisions with local declarations and
  `use` imports must be rejected consistently rather than depending on object-assignment order.
- **Caching**: A child's resolved facts depend on passed parent values even when the child's source AST is unchanged.
  Syntax caching may remain source-only, but semantic result caching must include the group environment.
- **No compatibility burden**: The project has not been released, so implement the final contract directly.

## Related Items

- **Related**: `docs/todos/477-establish-project-object-model.md`
- **Related**: `docs/todos/478-resolve-group-memory-exposures-through-alias-table.md`
- **Related**: `docs/todos/460-fix-cross-block-constant-cache-dependencies.md`

## Notes

- The rejected alternatives were automatic ancestor lookup and whole-namespace imports. Both hide the exact values a
  group requires.
- `pass` is intentionally singular and granular. It represents one compile-time value crossing one group boundary.
