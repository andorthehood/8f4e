# Program Compiler Feature

## Purpose

Compiles 8f4e code blocks into executable WASM bytecode. Coordinates with the compiler callback, manages compilation options, maps errors back to source blocks, and handles memory initialization.

## Key Behaviors

- **Code Flattening**: Converts code blocks into separate modules and functions arrays, sorted by `creationIndex`
- **Compiler Invocation**: Calls `compileCode` callback with source and options
- **Compilation Options**: Sets compiler entry-point options
- **Error Mapping**: Maps compilation errors back to specific code blocks and line numbers
- **Memory Management**: Tracks compiler-derived memory usage and handles memory recreation events
- **Performance Tracking**: Measures and logs compilation time
- **Auto Compilation**: Recompiles changed compilable blocks automatically
- **Recompile Debounce**: Defaults to 500ms and can be configured with `; @config recompileDebounceDelay <ms>`

## Compiler Options

```typescript
{
  startingMemoryWordAddress: 0,
}
```

**Note**: The compiler derives the required memory size from its allocation plan and returns the effective page-rounded size. Environment constants are provided via an auto-managed `constants env` block, with runtime-owned lines contributed by the selected runtime.

## Block Type Handling

- **Modules**: Includes `module` and `constants` block types
- **Functions**: Includes `function` block types
- **Excluded**: `note` and `unknown` blocks are not passed to WASM compiler

## Subscriptions & Callbacks

### Subscriptions

- `graphicHelper.selectedCodeBlock.code` - Schedules compilation when the selected compilable block changes
- `graphicHelper.selectedCodeBlockForProgrammaticEdit.code` - Schedules compilation when programmatic edits change a compilable block

### Callbacks Used

- `state.callbacks.compileCode(modules, options, functions)` - Returns compilation result with bytecode and memory info

### State Touched

- `state.compiler.isCompiling` - Boolean flag during compilation
- `state.compiler.compiledModules` - Compiled module bytecode
- `state.compiler.compiledFunctions` - Compiled function bytecode
- `state.compiler.byteCodeSize` - Total bytecode size in bytes
- `state.compiler.requiredMemoryBytes` - Bytes required by the compiler's static memory plan
- `state.compiler.allocatedMemoryBytes` - Actual WebAssembly memory capacity allocated by the host
- `state.compiler.compilationTime` - Compilation duration in ms
- `state.compiler.lastCompilationStart` - Timestamp of compilation start
- `state.codeErrors.compilationErrors` - Array of compilation errors

## Integration Points

- **Binary Assets**: Exposes memory recreation state used by the editor environment binary-assets plugin to reload assets
- **Runtime**: Runtime selection affects environment constants
- **Runtime**: Compiled modules are consumed by runtime implementations and editor widgets

## Error Handling

Compilation errors include:
- Block ID and line number
- Error message and type
- Mapped from compiler output to source blocks

## Memory Actions

The compiler reports memory state:
- **`recreated`**: WASM memory was newly created or resized
- **`reused`**: Existing memory was reused

When memory is recreated, `state.compiler.hasMemoryBeenReinitialized` is updated. The editor environment binary-assets plugin observes that state and reloads active assets into memory when needed.

## References

- Compiler callback contract: Defined in state types

## Notes & Limitations

- Compilation is synchronous from the effect's perspective but callback may be async
- Blocks are compiled in `creationIndex` order
- Memory capacity changes require runtime restart
- Environment constants are provided via auto-managed `constants env` block
