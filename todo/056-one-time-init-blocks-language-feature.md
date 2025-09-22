# TODO: Add startInit / endInit one-time init blocks in code modules

**Priority**: 🟡
**Estimated Effort**: 5-7 days
**Created**: 2025-01-27
**Status**: Open
**Completed**: 

## Problem Description

The 8f4e language currently lacks support for one-time initialization code that executes exactly once at program start. Code that should run only during initialization is currently placed in the main execution loop, causing it to run repeatedly and inefficiently.

- What is the current state?
  - Existing `initBlock`/`initBlockEnd` instructions handle per-module memory initialization
  - No language construct for program-wide one-time initialization code
  - Initialization logic must be written in main loop with manual guards to prevent re-execution
  - All runtimes (main thread, web workers, audio worklets) lack one-time init execution model

- Why is this a problem?
  - Inefficient execution of initialization code in main loops
  - Manual state tracking required to prevent re-initialization
  - Larger compiled bytecode due to repeated execution of init-only code
  - Poor separation of concerns between initialization and runtime logic
  - Potential for initialization bugs when manual guards fail

- What impact does it have?
  - Reduced runtime performance due to unnecessary repeated execution
  - More complex code patterns required for one-time setup
  - Increased risk of initialization-related bugs
  - Suboptimal resource utilization across all runtime targets

## Proposed Solution

Implement a comprehensive one-time initialization system with new language constructs and runtime execution model:

- High-level approach:
  - Add `startInit` and `endInit` language instructions for program-wide initialization blocks
  - Extend compiler to generate separate one-time init functions
  - Modify all runtimes to execute one-time init before starting main loops
  - Maintain compatibility with existing per-module `initBlock` system

- Key changes required:
  - New instruction compilers for `startInit`/`endInit` 
  - Compiler context to track program-wide init code separately
  - Runtime execution model updates across all targets
  - Editor syntax highlighting and validation support

- Alternative approaches considered:
  1. **New language constructs**: `startInit`/`endInit` (recommended - clear semantics)
  2. **Extend existing initBlock**: Add program-wide scope (confusing with current per-module usage)
  3. **Compiler flags**: Automatic detection of init-only code (too complex, unclear boundaries)

## Implementation Plan

### Step 1: Define language syntax and semantics
- Design `startInit`/`endInit` instruction syntax and behavior
- Define interaction with existing `initBlock` system (init order, scope)
- Specify execution semantics: exactly once, before main loop, error handling
- Expected outcome: Clear language specification document
- Dependencies: Understanding of current init system and runtime architecture

### Step 2: Add instruction compilers for startInit/endInit
- Create `startInit.ts` and `endInit.ts` instruction compiler files
- Add new `PROGRAM_INIT` block type to distinguish from module-level init
- Extend compilation context to track program init bytecode separately
- Update instruction compiler index and type definitions
- Expected outcome: Compiler can parse and validate startInit/endInit blocks
- Dependencies: Step 1 (language specification)

### Step 3: Extend compiler to generate one-time init functions
- Modify main compiler to collect program init bytecode across all modules
- Generate separate WASM function for program-wide initialization
- Export program init function alongside existing cycle and init functions
- Handle inter-module dependencies in program init execution order
- Expected outcome: Compiled WASM includes program init function
- Dependencies: Step 2 (instruction compilers)

### Step 4: Update runtime execution model
- Modify `createModule.ts` in all runtime packages to expose program init function
- Update runtime initialization to call program init exactly once before starting loops
- Ensure program init runs after per-module init but before first cycle
- Add error handling for program init failures
- Expected outcome: All runtimes execute program init once at startup
- Dependencies: Step 3 (compiler generates program init functions)

### Step 5: Add editor support and syntax highlighting
- Update editor instruction list to include `startInit`/`endInit`
- Add syntax highlighting rules for new init block instructions
- Implement editor validation for proper init block nesting
- Update code formatting and indentation rules
- Expected outcome: Full editor support for new init block syntax
- Dependencies: Steps 1-2 (language and compiler support)

### Step 6: Comprehensive testing and validation
- Create test suite for startInit/endInit instruction compilation
- Add runtime tests for one-time execution across all runtime targets
- Test interaction between program init and existing module init
- Add integration tests for complex initialization scenarios
- Performance benchmarks comparing before/after optimization
- Expected outcome: Robust test coverage and performance validation
- Dependencies: Steps 1-5 (full implementation)

## Success Criteria

- [ ] `startInit` and `endInit` instructions compile without errors
- [ ] Program init code executes exactly once at program startup
- [ ] Program init runs after module init but before first main loop cycle
- [ ] All runtime targets (main thread, web workers, audio worklets) support program init
- [ ] Existing `initBlock` functionality remains unchanged and compatible
- [ ] Editor provides full syntax highlighting and validation for new constructs
- [ ] Performance improvement demonstrated for code moved from main loop to program init
- [ ] Comprehensive test coverage for new functionality
- [ ] Documentation updated with usage examples and best practices

## Affected Components

- `packages/compiler/src/instructionCompilers/startInit.ts` - New instruction compiler for startInit
- `packages/compiler/src/instructionCompilers/endInit.ts` - New instruction compiler for endInit  
- `packages/compiler/src/instructionCompilers/index.ts` - Register new instruction compilers
- `packages/compiler/src/types.ts` - Add PROGRAM_INIT block type and context extensions
- `packages/compiler/src/compiler.ts` - Track and compile program init bytecode
- `packages/compiler/src/index.ts` - Generate program init WASM functions
- `packages/runtime-main-thread-logic/src/createModule.ts` - Add program init execution
- `packages/runtime-web-worker-logic/src/createModule.ts` - Add program init support
- `packages/runtime-audio-worklet/src/createModule.ts` - Add program init execution
- `packages/editor/src/state/effects/codeBlocks/graphicHelper.ts` - Add new instructions to editor
- `packages/compiler/tests/` - Comprehensive test suite for new functionality

## Risks & Considerations

- **Risk 1**: Execution order complexity between module init and program init
  - Mitigation: Clear specification of execution phases and comprehensive testing
- **Risk 2**: Runtime compatibility across different execution environments
  - Mitigation: Consistent implementation patterns across all runtime targets
- **Risk 3**: Breaking changes to existing initialization patterns
  - Mitigation: Maintain full backward compatibility with existing initBlock system
- **Dependencies**: Requires coordination across compiler, runtime, and editor packages
- **Breaking Changes**: None expected - purely additive feature with backward compatibility

## Related Items

- **Related**: Existing `initBlock`/`initBlockEnd` per-module initialization system
- **Related**: Runtime architecture and WASM function generation
- **Related**: Editor instruction parsing and syntax highlighting system
- **Blocks**: Any future init-related optimizations depend on this foundation

## References

- [Current initBlock implementation](packages/compiler/src/instructionCompilers/initBlock.ts)
- [Runtime createModule patterns](packages/runtime-main-thread-logic/src/createModule.ts)
- [WASM function generation utilities](packages/compiler/src/wasmUtils/sectionHelpers.ts)
- [Editor instruction integration](packages/editor/src/state/effects/codeBlocks/graphicHelper.ts)

## Notes

- Start with main thread runtime as reference implementation, then extend to other runtimes
- Consider future optimization opportunities for program init code (dead code elimination, etc.)
- Document best practices for when to use program init vs module init vs main loop code
- Ensure program init failures provide clear error messages and debugging information

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.