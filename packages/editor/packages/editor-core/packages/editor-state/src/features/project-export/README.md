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

Project file export captures a deep copy of `serializeToProject(state)` and the export filename in the input
handler. Live source arrays, nested groups, configuration changes, and callback replacement during an asynchronous
wait cannot change that export. The formatter is dynamically imported on first export and its import promise is
shared across exports and editors. Failed imports clear the cached promise so later exports can retry where the
browser module loader permits recovery. Autosave and configuration registration remain eager.

An optional `prepareProjectExport(fileName)` callback runs before any asynchronous wait, preserving user activation
for a native save picker. It returns a promise of a text writer, or `undefined` for cancellation:

```ts
prepareProjectExport?: (fileName: string) => Promise<((data: string) => Promise<void>) | undefined>;
```

When both callbacks are configured, preparation takes precedence over `exportProject(data, fileName)`. The default
composition opens the picker immediately, then waits for its file handle before importing the formatter. It creates
a writable only after formatting succeeds. Browsers without a save picker receive a deferred download writer.
Cancelling the picker does not load the formatter or trigger a fallback download.

Existing `exportProject(data, fileName)` callbacks retain their string-based signature, but run after the formatter
loads. Custom hosts using native save pickers should implement `prepareProjectExport` to acquire their destination
before that wait. Download callbacks and other custom saves can keep the existing API.

The effect catches preparation, snapshot, formatter, and save errors; cancellation is quiet. Disposal removes its
listeners and subscriptions and stops exports waiting on a picker or formatter from writing afterward. Once a
writer has started, that writer owns completion of the save.

The synchronous `serializeProjectTo8f4e` export from `@8f4e/editor-state` remains available. The library builds the
formatter as a second entry so bundlers can remove the unused public re-export and retain the dynamic import.
Consumers that explicitly use the synchronous API intentionally load the formatter.

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
