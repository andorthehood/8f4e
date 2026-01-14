# Project Export Feature

## Purpose

Serializes editor state to exportable project formats. Provides two export modes: basic serialization for file saving and runtime-ready exports that include compiled data and memory snapshots.

## Key Behaviors

- **Project Serialization**: Converts editor state to JSON-compatible project format
- **Coordinate Conversion**: Transforms pixel coordinates to grid coordinates for persistence
- **Runtime-Ready Export**: Includes compiled modules, config, and memory snapshots
- **Session Saving**: Supports saving current session state
- **WASM Export**: Enables export of compiled WASM modules

## Export Modes

### Basic Serialization (`serializeToProject`)

Creates a minimal project file for saving:
- Code blocks with grid coordinates
- Viewport state
- Binary assets
- Optionally includes compiled modules

### Runtime-Ready Export (`serializeToRuntimeReadyProject`)

Creates a complete export with compiled data:
- Everything from basic serialization
- Compiled configuration
- Compiled modules and functions
- Memory snapshot
- Ready for immediate execution

## State Sources

Serializes from:
- `state.graphicHelper.codeBlocks` - Code block data
- `state.graphicHelper.viewport` - Viewport position and grid settings
- `state.binaryAssets` - Binary asset references
- `state.compiler.compiledModules` - Compiled WASM bytecode
- `state.compiledConfig` - Compiled configuration object

## Integration Points

- **Edit History**: Uses basic serialization for undo/redo snapshots
- **Project Import**: Exported projects are loaded through project import feature
- **Config Compiler**: Includes compiled config in runtime-ready exports
- **Program Compiler**: Includes compiled modules in runtime-ready exports

## Project Schema

The project structure is defined by the serialization functions:

```typescript
{
  codeBlocks: Array<CodeBlock>,     // With grid coordinates
  viewport: {
    gridCoordinates: { x, y }       // Grid position, not pixels
  },
  binaryAssets: Array<BinaryAsset>,
  compiledModules?: Array<Module>,  // Optional in basic mode
  compiledConfig?: Config,          // Runtime-ready only
  // postProcessEffects are derived, not persisted
}
```

## Coordinate Systems

- **Editor State**: Uses pixel coordinates for viewport
- **Serialized Project**: Uses grid coordinates for portability
- Conversion: `gridCoord = Math.round(pixelCoord / gridSize)`

## References

- [`serializeToProject.ts`](./serializeToProject.ts) - Basic serialization
- [`serializeToRuntimeReadyProject.ts`](./serializeToRuntimeReadyProject.ts) - Runtime-ready export
- Project import counterpart: See `project-import` feature

## Notes & Limitations

- Post-process effects are derived from shader blocks and not persisted
- Grid coordinate conversion may lose sub-grid precision
- Compiled data is excluded from history snapshots to save memory
- Binary assets are stored by reference, not embedded
