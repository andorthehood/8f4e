# Project Export Feature

## Purpose

Serializes editor state for session persistence and project file export.

## Key Behaviors

- **Session JSON Serialization**: `serializeToProject` converts editor code blocks to the JSON-safe session structure
- **Session Saving**: Saves current session state through the local/session storage callbacks
- **`.8f4e` Export**: Converts the session project structure to the `.8f4e` file format for project downloads
- **WASM Export**: Exports compiled WASM modules through the separate WASM export path

## Export

### Session JSON Serialization (`serializeToProject`)

`serializeToProject` creates the JSON representation used for session saving and persistence. It is not the exported `.8f4e` file format.

Includes:
- Code blocks
- Asset directives remain embedded in code blocks

### `.8f4e` Project Export

Project file export first calls `serializeToProject` to collect the current code blocks, then passes that structure to `serializeProjectTo8f4e` to produce the `.8f4e` file content. This path is used for project downloads, while JSON output from `serializeToProject` is intended for session persistence only.

### WASM Export

WASM export is separate from project serialization and writes compiled binary modules through the configured `exportBinaryCode` callback.

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

- [`serializeToProject.ts`](./serializeToProject.ts) - Session JSON structure serialization
- [`serializeTo8f4e.ts`](./serializeTo8f4e.ts) - `.8f4e` file serialization
- Project import counterpart: See `project-import` feature

## Notes & Limitations

- Post-process effects are derived from shader blocks and not persisted
- Compiled data is excluded from history snapshots to save memory
- Binary assets are declared in code blocks with editor directives and loaded by the lazy editor environment plugin; exported projects do not embed binary payloads
