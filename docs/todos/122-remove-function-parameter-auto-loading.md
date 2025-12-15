---
title: 'TODO: Remove Automatic Function Parameter Loading'
priority: High
effort: 2-3d
created: 2025-12-15
status: Open
completed: null
---

# TODO: Remove Automatic Function Parameter Loading

## Problem Description

- The `function` instruction in `packages/compiler/src/instructionCompilers/function.ts` (lines 46-53) automatically loads all function parameters onto the stack when a function starts executing.
- This is unconventional for WebAssembly, where function parameters are available as local variables (indices 0, 1, 2, etc.) and should be accessed via `local.get` instructions in the function body as needed.
- The current approach forces all parameters onto the stack immediately, preventing selective parameter access and making stack management more complex.
- This creates issues when functions need to manipulate parameters in a different order or only use specific parameters.

## Proposed Solution

Remove the automatic parameter loading code (lines 46-53 in `function.ts`) and require users to explicitly use `localGet param0`, `localGet param1`, etc. to access function parameters as needed. This aligns with WebAssembly conventions and provides users with explicit control over parameter access.

**Note**: Backwards compatibility is not a concern since the programming language has not been released to the public yet.

## Implementation Plan

### Step 1: Remove automatic parameter loading code
- Remove lines 46-53 from `packages/compiler/src/instructionCompilers/function.ts`
- Keep lines 38-44 that register parameters as local variables
- Ensure the parameter locals remain accessible via `localGet param0`, `localGet param1`, etc.
- Expected outcome: Functions start with an empty stack; parameters must be explicitly loaded

### Step 2: Update existing test cases
- Update `packages/compiler/tests/instructions/function.test.ts` to use explicit `localGet` for parameter access
- Update `packages/compiler/tests/pureFunction.test.ts` to use explicit `localGet` for parameter access
- Add new test cases covering:
  - Functions that access parameters in different orders
  - Functions that only access some parameters
  - Functions with multiple parameters of different types
  - Functions that access the same parameter multiple times
- Expected outcome: All tests pass with the new explicit parameter access pattern

### Step 3: Verify localGet instruction compatibility
- Ensure `packages/compiler/src/instructionCompilers/localGet.ts` correctly handles parameter locals
- Verify parameter locals are properly typed (int vs float)
- Add tests specifically for parameter access via localGet
- Expected outcome: `localGet` instruction works correctly with function parameters

### Step 4: Update documentation and examples
- Update any documentation that shows function usage patterns
- Update `docs/instructions.md` or similar with the new explicit pattern
- Add examples showing:
  - Basic parameter access
  - Out-of-order parameter access
  - Selective parameter use
  - Parameter reuse
- Expected outcome: Documentation clearly explains the new pattern

### Step 5: Add helpful validation features
- Consider adding warnings if declared parameters are never accessed via localGet
- Consider adding validation for common mistakes (expecting parameters on stack)
- Validate stack state at function boundaries
- Expected outcome: Helpful compiler messages guide users to correct usage

## Success Criteria

- [ ] Automatic parameter loading code removed from `function.ts`
- [ ] Parameter locals remain accessible via `localGet param0`, etc.
- [ ] All existing tests updated and passing with explicit `localGet` usage
- [ ] New tests added covering edge cases and various parameter access patterns
- [ ] Documentation updated with clear examples of the new pattern
- [ ] No backwards compatibility issues (language not yet public)

## Example Pattern Change

**Current (auto-loaded):**
```
function add int int
add
functionEnd int
```

**After implementation (explicit):**
```
function add int int
localGet param0
localGet param1
add
functionEnd int
```

**Out-of-order parameter access (new capability):**
```
function subtract int int
localGet param1
localGet param0
sub
functionEnd int
```

**Selective parameter use (new capability):**
```
function double int int
localGet param0
push 2
mul
functionEnd int
```

## Affected Components

- `packages/compiler/src/instructionCompilers/function.ts` – remove auto-loading code
- `packages/compiler/src/instructionCompilers/localGet.ts` – verify parameter local support
- `packages/compiler/tests/instructions/function.test.ts` – update test cases
- `packages/compiler/tests/pureFunction.test.ts` – update test cases
- Documentation files showing function usage examples

## Risks & Considerations

- **Breaking change**: All existing function code needs to be updated, but this is acceptable since the language is not yet public
- **User confusion**: Users familiar with the old pattern need to learn the new explicit pattern. Mitigation: clear documentation and helpful error messages
- **Migration effort**: Existing examples and tests need updates. Mitigation: systematic test updates and documentation refresh
- **Stack tracking**: Users now need to understand when parameters are loaded onto the stack. Mitigation: clear documentation about stack-based execution model

## Related Items

- **Related**: `docs/brainstorming_notes/017-function-parameter-loading-strategy.md` – full analysis and decision rationale
- **Related**: `docs/brainstorming_notes/016-compiler-pure-functions.md` – pure function design
- **Related**: GitHub Issue/PR discussing the original problem

## References

- `docs/brainstorming_notes/017-function-parameter-loading-strategy.md`
- `packages/compiler/src/instructionCompilers/function.ts`
- `packages/compiler/src/instructionCompilers/localGet.ts`
- WebAssembly specification on function parameters and local variables

## Notes

- Parameters are registered as locals with names `param0`, `param1`, etc. (see function.ts lines 38-44)
- The `localGet` instruction already supports accessing any local variable by name
- This change makes function parameters work consistently with other local variables
- Function parameter types (int/float) are preserved in the local variable metadata
- The change simplifies the mental model: all locals (including parameters) are accessed the same way
