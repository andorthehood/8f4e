# Project Export Feature

## Purpose

Serializes editor state for session persistence and project file export.

## Key Behaviors

- **Session Object Serialization**: `serializeToProject` converts editor code blocks to `ProjectObjectModel`
- **Session Saving**: Saves current session state through the local/session storage callbacks
- **`.8f4e` Save/Export**: Serializes canonical source through separate `saveProject` and `exportProject` callbacks
- **WASM Export**: Exports compiled WASM modules through the separate WASM export path

## Export

### Session JSON Serialization (`serializeToProject`)

`serializeToProject` creates the compiler-owned `ProjectObjectModel` used for session saving, history, and live
compilation. It is not a separate editor schema and it is not the exported `.8f4e` file format.

Each known editor block is placed directly into the model's `modules`, `functions`, `constants`, `prototypes`,
`includes`, or `notes` collection. Incomplete blocks go to `unknown`; modules carry their required `entry`. Asset
directives remain embedded in block source. All notes belong to the project and are included in session saves,
history snapshots, and project files, regardless of their names.

### `.8f4e` Project Export

The `saveProject` and `exportProject` events first call `serializeToProject` to collect the current code blocks,
then pass that structure to `serializeProjectTo8f4e` to produce canonical `.8f4e` source. Both callbacks receive that
text and the configured export filename. The focused canvas's `Cmd+S`/`Ctrl+S` shortcut dispatches `saveProject`.
The export menu dispatches `exportProject`, which the default composition implements as Save As.

Code-change subscriptions continue to call `saveSession` with the project object for browser recovery. Explicit
file saves do not call `saveSession`, and automatic session saves do not write to disk. Browser handles, permissions,
and fallback downloads belong to the host composition; the editor state owns serialization and event routing.

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

- Compiled data is excluded from history snapshots to save memory
- Binary assets are declared in code blocks with `@config bin...` values and loaded by the lazy editor environment plugin; exported projects do not embed binary payloads
