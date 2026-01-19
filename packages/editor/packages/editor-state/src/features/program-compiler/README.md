# Program Compiler Feature

## Purpose

Compiles 8f4e code blocks into executable WASM bytecode. Coordinates with the compiler callback, manages compilation options, maps errors back to source blocks, and handles memory initialization.

## Key Behaviors

- **Code Flattening**: Converts code blocks into separate modules and functions arrays, sorted by `creationIndex`
- **Compiler Invocation**: Calls `compileCode` callback with source and options
- **Compilation Options**: Configures memory size, environment constants, and ignored keywords
- **Error Mapping**: Maps compilation errors back to specific code blocks and line numbers
- **Memory Management**: Tracks memory allocation and handles memory recreation events
- **Performance Tracking**: Measures and logs compilation time
- **Auto-Compile Control**: Supports precompiled mode and disable-auto-compile paths

## Compiler Options

```typescript
{
  memorySizeBytes: number,           // From compiledConfig, default 1MB
  startingMemoryWordAddress: 0,
  environmentExtensions: {
    ignoredKeywords: [               // Annotation keywords not compiled
      'debug', 'button', 'switch', 
      'offset', 'plot', 'piano'
    ]
  }
}
```

**Note**: Environment constants (SAMPLE_RATE, AUDIO_BUFFER_SIZE, etc.) are no longer injected via compiler options. Instead, they are provided via an auto-managed `constants env` block that is automatically created and updated by the editor-state.

## Block Type Handling

- **Modules**: Includes `module` and `constants` block types
- **Functions**: Includes `function` block types
- **Excluded**: `config`, `comment`, `vertexShader`, `fragmentShader` blocks are not passed to WASM compiler

## Events & Callbacks

### Events Listened To

- `forceCompile` - Triggers immediate compilation

### Events Dispatched

- `loadBinaryFilesIntoMemory` - Triggered when WASM memory is recreated

### Callbacks Used

- `state.callbacks.compileCode(modules, options, functions)` - Returns compilation result with bytecode and memory info

### State Touched

- `state.compiler.isCompiling` - Boolean flag during compilation
- `state.compiler.compiledModules` - Compiled module bytecode
- `state.compiler.compiledFunctions` - Compiled function bytecode
- `state.compiler.byteCodeSize` - Total bytecode size in bytes
- `state.compiler.allocatedMemorySize` - Memory allocation size
- `state.compiler.compilationTime` - Compilation duration in ms
- `state.compiler.lastCompilationStart` - Timestamp of compilation start
- `state.codeErrors.compilationErrors` - Array of compilation errors

## Integration Points

- **Config Compiler**: Memory size and sample rate come from compiled config
- **Binary Assets**: Triggers asset loading when memory is recreated
- **Runtime**: Runtime selection affects environment constants
- **Project Export**: Compiled modules are included in runtime-ready exports

## Error Handling

Compilation errors include:
- Block ID and line number
- Error message and type
- Mapped from compiler output to source blocks

## Memory Actions

The compiler reports memory state:
- **`recreated`**: WASM memory was newly created or resized
- **`reused`**: Existing memory was reused

When memory is recreated, binary assets must be reloaded.

## References

- Error mapping utilities: Similar to config compiler error mapping
- Compiler callback contract: Defined in state types

## Notes & Limitations

- Compilation is synchronous from the effect's perspective but callback may be async
- Blocks are compiled in `creationIndex` order
- Memory size changes require runtime restart
- Environment constants are provided via auto-managed `constants env` block
