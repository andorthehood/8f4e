# Project Export Feature

## Purpose

Serializes editor state to the project format used for file export and session persistence.

## Key Behaviors

- **Project Serialization**: Converts editor code blocks to the project structure
- **Session Saving**: Supports saving current session state
- **WASM Export**: Enables export of compiled WASM modules

## Export

### Project Serialization (`serializeToProject`)

Creates a minimal project file for saving:
- Code blocks
- Asset directives remain embedded in code blocks

## State Sources

Serializes from:
- `state.graphicHelper.codeBlocks` - Code block data

## Integration Points

- **Edit History**: Uses basic serialization for undo/redo snapshots
- **Project Import**: Exported projects are loaded through project import feature

## Project Schema

The project structure is defined by the serialization functions:

```typescript
{
  codeBlocks: Array<CodeBlock>,
}
```

## References

- [`serializeToProject.ts`](./serializeToProject.ts) - Project structure serialization
- [`serializeTo8f4e.ts`](./serializeTo8f4e.ts) - `.8f4e` text serialization
- Project import counterpart: See `project-import` feature

## Notes & Limitations

- Post-process effects are derived from shader blocks and not persisted
- Compiled data is excluded from history snapshots to save memory
- Binary assets are declared in code blocks with editor directives and loaded by the lazy editor environment plugin
