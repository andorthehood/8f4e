---
title: 'TODO: Implement Explicit Parameter Declaration (Option 1a)'
priority: High
effort: 3-4d
created: 2025-12-15
status: Open
completed: null
---

# TODO: Implement Explicit Parameter Declaration (Option 1a)

## Problem Description

- The `function` instruction in `packages/compiler/src/instructionCompilers/function.ts` (lines 46-53) automatically loads all function parameters onto the stack when a function starts executing.
- This is unconventional for WebAssembly, where function parameters are available as local variables (indices 0, 1, 2, etc.) and should be accessed via `local.get` instructions in the function body as needed.
- The current approach forces all parameters onto the stack immediately, preventing selective parameter access and making stack management more complex.
- This creates issues when functions need to manipulate parameters in a different order or only use specific parameters.

## Proposed Solution

Implement Option 1a: Introduce explicit `param` instructions for declaring named function parameters. This approach:
- Removes automatic parameter loading (lines 46-53 in `function.ts`)
- Changes function declaration to only include the function name (no type signature on the function line)
- Adds a new `param <type> <name>` instruction for declaring each parameter
- Parameters are accessed via `localGet <name>` (or potentially a new `paramGet <name>`)
- The order of `param` instructions defines the function's type signature

This aligns with WebAssembly conventions, provides explicit control over parameter access, and improves code readability through named parameters. The syntax is also consistent with the existing `local int x` pattern.

**Note**: Backwards compatibility is not a concern since the programming language has not been released to the public yet.

## Implementation Plan

### Step 1: Modify function instruction to not expect type signature
- Update `packages/compiler/src/instructionCompilers/function.ts` to only parse function name from line.arguments[0]
- Remove parsing of parameter types from line.arguments.slice(1)
- Remove lines 46-53 that auto-load parameters onto the stack
- Remove lines 38-44 that pre-register parameters (will be handled by `param` instruction instead)
- Function signature will be built dynamically as `param` instructions are encountered
- Expected outcome: `function <name>` line only contains the function name

### Step 2: Create new param instruction
- Create `packages/compiler/src/instructionCompilers/param.ts`
- Parse `param <type> <name>` syntax (e.g., `param int x`)
- Validate that `param` instructions only appear immediately after `function` and before other instructions
- Register parameter as a local variable with the given name
- Append parameter type to the function signature being built
- Track parameter order to assign correct local indices (0, 1, 2, etc.)
- Expected outcome: `param` instruction registers named parameters and builds function signature

### Step 3: Update function end validation
- Modify `packages/compiler/src/instructionCompilers/functionEnd.ts` to finalize function signature
- Validate that the signature built from `param` instructions matches return types on `functionEnd` line
- Ensure all required metadata is properly set
- Expected outcome: Function signature is correctly finalized with parameters from `param` instructions

### Step 4: Update existing test cases
- Update `packages/compiler/tests/instructions/function.test.ts` to use new `param` and `localGet` syntax
- Update `packages/compiler/tests/pureFunction.test.ts` to use new syntax
- Add new test cases covering:
  - Functions with named parameters accessed in declaration order
  - Functions that access parameters in different orders
  - Functions that only access some parameters
  - Functions with multiple parameters of different types
  - Functions that access the same parameter multiple times
  - Validation that `param` must come immediately after `function`
- Expected outcome: All tests pass with the new explicit parameter declaration pattern

### Step 5: Update instruction compiler index
- Add the new `param` instruction to `packages/compiler/src/instructionCompilers/index.ts`
- Ensure it's properly exported and registered
- Expected outcome: `param` instruction is available for use

### Step 6: Verify localGet instruction compatibility
- Ensure `packages/compiler/src/instructionCompilers/localGet.ts` correctly handles named parameter locals
- Verify parameter locals are properly typed (int vs float)
- Add tests specifically for parameter access via localGet with named parameters
- Expected outcome: `localGet` instruction works correctly with named function parameters

### Step 7: Update documentation and examples
- Update any documentation that shows function usage patterns
- Update `docs/instructions.md` or similar with the new `param` instruction and syntax
- Add examples showing:
  - Basic parameter declaration and access
  - Out-of-order parameter access
  - Selective parameter use
  - Parameter reuse
  - Named parameters for improved readability
- Expected outcome: Documentation clearly explains the new pattern

### Step 8: Add helpful validation features
- Add validation that `param` instructions come before any other function body instructions
- Add warnings if declared parameters are never accessed via localGet
- Validate stack state at function boundaries
- Add clear error messages for common mistakes
- Expected outcome: Helpful compiler messages guide users to correct usage

## Success Criteria

- [ ] `function` instruction modified to only accept function name (no type signature)
- [ ] New `param <type> <name>` instruction implemented and working
- [ ] Function signature built dynamically from `param` instructions
- [ ] Automatic parameter loading code removed from `function.ts`
- [ ] Named parameters accessible via `localGet <name>`
- [ ] All existing tests updated and passing with new `param` and `localGet` syntax
- [ ] New tests added covering edge cases, validation, and various parameter access patterns
- [ ] Documentation updated with clear examples of the new pattern
- [ ] No backwards compatibility issues (language not yet public)

## Example Pattern Change

**Current (auto-loaded):**
```
function add int int
add
functionEnd int
```

**After implementation (Option 1a with named params):**
```
function add
param int x
param int y
localGet x
localGet y
add
functionEnd int
```

**Out-of-order parameter access (new capability):**
```
function subtract
param int x
param int y
localGet y
localGet x
sub
functionEnd int
```

**Selective parameter use (new capability):**
```
function double
param int x
param int unused
localGet x
push 2
mul
functionEnd int
```

**Better readability with meaningful names:**
```
function calculateArea
param int width
param int height
localGet width
localGet height
mul
functionEnd int
```

## Affected Components

- `packages/compiler/src/instructionCompilers/function.ts` – modify to only parse function name, remove auto-loading code
- `packages/compiler/src/instructionCompilers/param.ts` – **NEW** instruction compiler for parameter declaration
- `packages/compiler/src/instructionCompilers/functionEnd.ts` – update to finalize signature from `param` instructions
- `packages/compiler/src/instructionCompilers/index.ts` – add `param` instruction to exports
- `packages/compiler/src/instructionCompilers/localGet.ts` – verify named parameter local support
- `packages/compiler/tests/instructions/function.test.ts` – update test cases to new syntax
- `packages/compiler/tests/pureFunction.test.ts` – update test cases to new syntax
- Documentation files showing function usage examples

## Risks & Considerations

- **Breaking change**: All existing function code needs to be updated, but this is acceptable since the language is not yet public
- **Increased verbosity**: Functions require more lines (one per parameter). Mitigation: better readability through named parameters offsets this
- **Parser complexity**: Need to collect `param` instructions and validate ordering. Mitigation: clear validation rules and error messages
- **User confusion**: Users familiar with the old pattern need to learn the new explicit pattern. Mitigation: clear documentation and helpful error messages
- **Migration effort**: Existing examples and tests need updates. Mitigation: systematic test updates and documentation refresh
- **Stack tracking**: Users now need to understand when parameters are loaded onto the stack. Mitigation: clear documentation about stack-based execution model
- **Parameter ordering validation**: Must ensure `param` instructions come before other function body code. Mitigation: explicit validation in compiler

## Related Items

- **Related**: `docs/brainstorming_notes/017-function-parameter-loading-strategy.md` – full analysis, decision rationale, and Option 1a specification
- **Related**: `docs/brainstorming_notes/016-compiler-pure-functions.md` – pure function design
- **Related**: GitHub Issue/PR discussing the original problem
- **Context**: This implements Option 1a from the brainstorming document, chosen for consistency with `local` instruction syntax

## References

- `docs/brainstorming_notes/017-function-parameter-loading-strategy.md`
- `packages/compiler/src/instructionCompilers/function.ts`
- `packages/compiler/src/instructionCompilers/localGet.ts`
- WebAssembly specification on function parameters and local variables

## Notes

- Parameters are registered as locals with user-defined names (e.g., `x`, `y`, `width`) via the `param` instruction
- The `localGet` instruction already supports accessing any local variable by name, so it will work with named parameters
- This change makes function parameters work consistently with other local variables declared via `local` instruction
- Function parameter types (int/float) are preserved in the local variable metadata
- The change simplifies the mental model: all locals (including parameters) are declared and accessed the same way
- The `param` instruction syntax (`param int x`) mirrors the `local` instruction syntax (`local int x`) for consistency
- Function signature is built dynamically from the sequence of `param` instructions, not from the `function` line
- Parameter local indices (0, 1, 2, etc.) are assigned in the order `param` instructions appear
