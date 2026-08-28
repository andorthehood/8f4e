# Project Export Feature

## Purpose

Serializes editor state for session persistence and project file export.

## Key Behaviors

- **Session Object Serialization**: `serializeToProject` converts editor code blocks to `ProjectObjectModel`
- **Session Saving**: Saves current session state through the local/session storage callbacks
- **`.8f4e` Export**: Converts the session project structure to the `.8f4e` file format for project downloads
- **WASM Export**: Exports compiled WASM modules through the separate WASM export path

## Export

### Session JSON Serialization (`serializeToProject`)

`serializeToProject` creates the compiler-owned `ProjectObjectModel` used for session saving, history, and live
compilation. It is not a separate editor schema and it is not the exported `.8f4e` file format.

Each known editor block is placed directly into the model's `modules`, `functions`, `constants`, `prototypes`,
`includes`, or `notes` collection. Incomplete blocks go to `unknown`; modules carry their required `entry`. Asset
directives remain embedded in block source.

### `.8f4e` Project Export

Project file export first calls `serializeToProject` to collect the current code blocks, then passes that structure to `serializeProjectTo8f4e` to produce the `.8f4e` file content. This path is used for project downloads, while JSON output from `serializeToProject` is intended for session persistence only.

### WASM Export

WASM export is separate from project serialization and writes compiled binary modules through the configured `exportBinaryCode` callback.

## State Sources

Serializes from:
- `state.codeBlockRendering.rootCodeBlocks` - Recursive root code-block tree

## Integration Points

- **Edit History**: Uses basic serialization for undo/redo snapshots
- **Project Import**: Exported projects are loaded through project import feature

## Project Object Model

The canonical structure is defined by `@8f4e/language-spec`:

```typescript
interface ProjectObjectModel {
	modules: ProjectModuleBlock[];
	functions: ProjectBlock[];
	constants: ProjectBlock[];
	prototypes: ProjectBlock[];
	includes: ProjectBlock[];
	notes: ProjectBlock[];
	unknown: ProjectBlock[];
	groups: ProjectGroupObjectModel[];
}

interface ProjectGroupObjectModel extends ProjectObjectModel {
	name: ProjectGroupName;
	entry: ProjectEntryName;
	code: string[];
	exposures: ProjectMemoryExposure[];
}
```

Collection membership defines block type. The adapter uses the editor's already-known block type and does not make the
compiler rediscover it from source text. Project groups are rendered as ordinary `CodeBlockGraphicData` values whose
optional `nestedProjectCodeBlocks` field owns the child project slice. Export recursively traverses that tree from
`rootCodeBlocks`, regardless of which slice `codeBlocks` currently points to. A group's `code` retains all source lines
owned by its visible wrapper, including comments and editor directives, while its nested blocks stay in the recursive
collections. Compilation recursively composes those collections into one program.

## References

- [`serializeToProject.ts`](./serializeToProject.ts) - Session JSON structure serialization
- [`serializeTo8f4e.ts`](./serializeTo8f4e.ts) - `.8f4e` file serialization
- Project import counterpart: See `project-import` feature

## Notes & Limitations

- Post-process effects are derived from shader blocks and not persisted
- Compiled data is excluded from history snapshots to save memory
- Binary assets are declared in code blocks with `@config bin...` values and loaded by the lazy editor environment plugin; exported projects do not embed binary payloads
