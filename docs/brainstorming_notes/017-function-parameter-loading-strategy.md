# Plan: Mitigate automatic parameter loading in function instruction

## Problem Statement

The `function` instruction in `packages/compiler/src/instructionCompilers/function.ts` (lines 46-53) automatically loads all function parameters onto the stack when a function starts executing. This creates several issues:

1. **Unconventional WebAssembly pattern**: In WebAssembly, function parameters are available as local variables (indices 0, 1, 2, etc.) and should be accessed via `local.get` instructions in the function body as needed, rather than being automatically pushed onto the stack.

2. **Lack of flexibility**: If a function needs to use parameters in a different order or selectively (e.g., only use the second parameter), the current implementation doesn't allow this. All parameters are forced onto the stack in declaration order.

3. **Stack management complexity**: When a function with 2 parameters starts, the stack already has 2 items on it. This can lead to:
   - Confusion about stack state at function entry
   - Difficulty tracking stack depth throughout the function
   - Potential for stack underflow/overflow errors

4. **Redundant operations**: The caller already has the parameters on the stack before calling the function (see `call.ts` lines 27-42). The automatic loading creates unnecessary stack operations.

## Current Implementation

```typescript
// Lines 46-53 in packages/compiler/src/instructionCompilers/function.ts
// Generate local.get instructions to load parameters onto the stack
// In WASM, function parameters are local variables at indices 0, 1, 2, etc.
// We need to explicitly load them onto the stack for the function body to use
paramTypes.forEach((type, index) => {
	context.loopSegmentByteCode.push(0x20); // local.get
	context.loopSegmentByteCode.push(index); // local index
	context.stack.push({ isInteger: type === 'int' });
});
```

Current behavior:
- Function declared as `function add int int`
- Compiler automatically generates: `local.get 0`, `local.get 1`
- Function body starts with both parameters on the stack
- Function body uses `add` instruction which consumes the two stack values

## Impact Analysis

### Affected Components
- **Function compilation**: `packages/compiler/src/instructionCompilers/function.ts`
- **Function bodies**: All existing functions that rely on auto-loaded parameters
- **Tests**: `packages/compiler/tests/instructions/function.test.ts`, `packages/compiler/tests/pureFunction.test.ts`
- **Documentation**: Any examples or docs showing function usage

### Breaking Change Potential
This is a **breaking change** if we remove automatic parameter loading:
- All existing functions expect parameters to be on the stack
- Function bodies would need to be rewritten to use `localGet param0`, `localGet param1`, etc.
- Test cases would need updates

## Mitigation Strategies

### Option 1: Remove Auto-Loading (Breaking Change, Most Conventional)

**Approach**: Remove lines 46-53 entirely. Users must explicitly use `localGet` to access parameters.

**Example transformation**:
```
// OLD (current)
function add int int
add
functionEnd int

// NEW (with explicit localGet)
function add int int
localGet param0
localGet param1
add
functionEnd int
```

**Pros**:
- Follows standard WebAssembly conventions
- More explicit and transparent
- Gives users full control over parameter access order
- Reduces "magic" behavior in the compiler
- Better aligns with how local variables work

**Cons**:
- Breaking change for all existing functions
- More verbose function bodies
- Migration effort required
- Potential for user confusion if parameters aren't loaded when expected

**Implementation steps**:
1. Remove automatic parameter loading code (lines 46-53)
2. Update all existing function test cases to use explicit `localGet`
3. Update documentation and examples
4. Consider adding a migration guide
5. Add validation to warn users if function body doesn't access declared parameters

### Option 2: Keep Auto-Loading, Add Named Parameter Access (Backward Compatible)

**Approach**: Keep the current auto-loading behavior but also support named parameter access via `localGet param0`, `localGet param1`, etc.

**Example**:
```
function add int int
// Stack already has param0 and param1
add
functionEnd int

// OR, user can manually manage:
function addReversed int int
clearStack  // Clear auto-loaded params
localGet param1
localGet param0
add
functionEnd int
```

**Pros**:
- No breaking changes
- Maintains backward compatibility
- Allows gradual migration

**Cons**:
- Maintains unconventional WebAssembly pattern
- Can be confusing (parameters both on stack AND in locals)
- Users might not understand the dual nature
- Doesn't solve the fundamental architectural issue

**Implementation steps**:
1. Keep existing auto-loading code
2. Ensure parameter locals are properly registered (already done in lines 38-44)
3. Document the dual-access pattern
4. Add examples showing both approaches

### Option 3: Configuration Flag (Flexible but Complex)

**Approach**: Add a compiler option or function-level pragma to control auto-loading behavior.

**Example**:
```
// With auto-load (default for compatibility)
function add int int
add
functionEnd int

// Without auto-load (opt-in)
function addExplicit int int !noAutoLoad
localGet param0
localGet param1
add
functionEnd int
```

**Pros**:
- Maximum flexibility
- Allows gradual migration
- Users can choose their preferred style

**Cons**:
- Adds complexity to the compiler
- Two different mental models to maintain
- Configuration overhead
- Harder to reason about function behavior without checking config

**Implementation steps**:
1. Add compiler option or pragma support
2. Conditionally execute parameter loading based on flag
3. Update documentation with both patterns
4. Add validation for consistency

### Option 4: Deprecation Path (Phased Approach)

**Approach**: Implement Option 1 (remove auto-loading) with a multi-phase rollout:

**Phase 1 (Current release)**:
- Add deprecation warnings when functions are used without explicit `localGet`
- Update documentation to show new pattern
- Keep auto-loading for backward compatibility

**Phase 2 (Next major version)**:
- Make auto-loading opt-in via flag (default off)
- Emit warnings for old pattern usage
- Migrate all internal examples/tests

**Phase 3 (Future major version)**:
- Remove auto-loading entirely
- Remove compatibility flag

**Pros**:
- Minimizes disruption
- Gives users time to migrate
- Clear communication and expectations

**Cons**:
- Extended timeline
- Maintains technical debt longer
- Requires multiple releases to complete

**Implementation steps**:
1. Add deprecation warnings in current version
2. Create migration guide and examples
3. Plan version schedule for each phase
4. Track migration progress

## Recommended Approach

**Option 1 (Remove Auto-Loading)** is recommended for the following reasons:

1. **Correctness**: Aligns with WebAssembly conventions and best practices
2. **Clarity**: Makes parameter access explicit and obvious
3. **Flexibility**: Users have full control over when and how parameters are accessed
4. **Long-term maintainability**: Removes "magic" behavior that can confuse users
5. **Clean architecture**: Parameters work consistently with other local variables

However, this should be implemented with care:
- Provide clear migration documentation
- Update all examples and tests
- Consider adding helpful compiler warnings/errors
- Ensure the `localGet` instruction works correctly with parameter locals

## Implementation Plan

If proceeding with Option 1 (recommended):

1. **Update function.ts**:
   - Remove lines 46-53 (auto-loading code)
   - Keep lines 38-44 (parameter local registration)
   - Ensure parameter locals are accessible via `localGet param0`, etc.

2. **Update existing tests**:
   - `packages/compiler/tests/instructions/function.test.ts`
   - `packages/compiler/tests/pureFunction.test.ts`
   - Add explicit `localGet` calls in all function bodies

3. **Verify localGet instruction**:
   - Ensure `packages/compiler/src/instructionCompilers/localGet.ts` handles parameter locals correctly
   - Add tests for parameter access patterns

4. **Documentation updates**:
   - Update `docs/instructions.md` or similar with new pattern
   - Add migration guide for existing code
   - Provide examples of common patterns (single param, multiple params, selective access)

5. **Add helpful features**:
   - Consider warning if declared parameters are never accessed
   - Add error if function expects parameters but doesn't load them before use
   - Validate stack state at function boundaries

6. **Testing**:
   - Verify all existing tests pass with explicit parameter loading
   - Add new tests for parameter access edge cases
   - Test parameter type checking still works correctly

## Alternative Considerations

### Option 1a: Explicit Parameter Declaration with `param` Instruction

An alternative syntax that builds on Option 1 would introduce explicit `param` instructions for declaring named parameters:

**Syntax**:
```
function add
param int x
param int y
localGet x
localGet y
add
functionEnd int
```

**Design**:
- Function declaration line contains only the function name (no type signature)
- Each parameter is declared with a `param <type> <name>` instruction
- The order of `param` instructions defines the function's type signature
- Parameters are accessed using `localGet <name>` or a new `paramGet <name>` instruction
- No backwards compatibility needed since language not yet released

**Advantages**:
- **Consistency**: Mirrors the existing `local int x` syntax pattern
- **Readability**: Named parameters (`x`, `y`) are clearer than `param0`, `param1`
- **Separation of concerns**: Parameter declaration is separate from function definition
- **Extensibility**: Easier to add features like optional parameters, default values, or parameter attributes in the future
- **Self-documenting**: Parameter names serve as inline documentation

**Disadvantages**:
- **Verbosity**: Requires additional lines for each parameter
- **Indirection**: Type signature not immediately visible on function declaration line
- **Parser complexity**: Need to collect `param` instructions before compiling function body
- **Ordering validation**: Need to ensure `param` instructions come before other function body instructions

**Implementation considerations**:
- The `function` instruction parser would only expect a function name
- A new `param` instruction compiler would register parameters in order
- Function signature would be built from the sequence of `param` declarations
- Could use either `localGet <name>` (reusing existing instruction) or introduce `paramGet <name>`
- Need validation to ensure `param` instructions come immediately after `function` and before any other instructions

**Example comparison**:

Original (with auto-loading):
```
function add int int
add
functionEnd int
```

Option 1 (explicit with positional names):
```
function add int int
localGet param0
localGet param1
add
functionEnd int
```

Option 1a (explicit with named params):
```
function add
param int x
param int y
localGet x
localGet y
add
functionEnd int
```

This alternative provides the benefits of Option 1 (explicit control) while improving code readability through named parameters.

### Should we auto-generate parameter names?

If not implementing Option 1a with explicit `param` instructions, parameters could still be named `param0`, `param1`, etc. Alternative naming schemes to consider:
- Auto-generating better names: `param_int_0`, `param_float_1`
- Using position-based names: `p0`, `p1`

This is orthogonal to the auto-loading issue and could be addressed separately if Option 1a is not chosen.

### Should we support parameter ordering flexibility?

If we remove auto-loading, users could access parameters in any order:
```
function subtract int int
localGet param1  // Load second param first
localGet param0  // Load first param second
sub              // Performs param0 - param1 (due to stack order)
functionEnd int
```

This provides flexibility but might be confusing. Documentation would need to be clear about stack ordering.

## Conclusion

The current automatic parameter loading is unconventional and limits flexibility. Removing it (Option 1) aligns with WebAssembly standards and provides users with explicit control over parameter access. While this is a breaking change, it improves the long-term quality and maintainability of the compiler. A clear migration path and updated documentation will help users transition smoothly.

## Decision

**Option 1 (Remove Auto-Loading) has been selected for implementation.**

Rationale:
- The programming language has not been released to the public yet, so backwards compatibility is not a concern
- This approach aligns with WebAssembly conventions and best practices
- It provides users with explicit control over parameter access order and timing
- It removes "magic" behavior that could confuse users and make debugging difficult
- The implementation is cleaner and more maintainable long-term

Implementation tracking: See `docs/todos/122-remove-function-parameter-auto-loading.md`
