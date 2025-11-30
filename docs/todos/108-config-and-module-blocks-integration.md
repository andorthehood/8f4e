---
title: 'TODO: Config vs Module Blocks Integration'
priority: Medium
effort: 1–2 days
created: 2025-11-30
status: Open
completed: null
---

# TODO: Config vs Module Blocks Integration

## Problem Description

The editor currently treats all code blocks as WASM modules and routes them into the compiler, assuming `module`/`moduleEnd` semantics. We want to introduce a second kind of code block that contains configuration programs instead of modules. These config blocks should:

- Be automatically detected as a distinct type (e.g. `config`/`configEnd` vs `module`/`moduleEnd`).
- Be excluded from the normal module compilation pipeline.
- Be sent to a dedicated config compiler (stack-config-based) that returns a JSON object.
- Drive editor/runtime configuration via the state-manager using the resulting JSON.
- Be parsed and applied **before** module compilation, so they can influence compiler options and the way modules are compiled.

The initial set of fields we want to drive from config blocks are:

- `runtimeSettings` (full runtime settings array).
- `selectedRuntime` (index or identifier of the active runtime).
- `memorySizeBytes` (WASM memory size for the project).
- Project metadata: `title`, `author`, and `description`.
- Example definitions under `src/examples` should be migrated to use config blocks for these values, with the long‑term goal of removing these fields from the `Project` type and treating them as config‑driven instead of hard‑coded.

Without this separation, configuration expressed in code blocks would either be ignored or incorrectly sent to the module compiler, making it hard to declaratively drive editor/runtime behaviour from within the canvas.

## Proposed Solution

High-level approach:

- Introduce a `blockType` field on each `CodeBlockGraphicData` to classify blocks as `module`, `config`, or `unknown`.
- Implement a `getBlockType(code: string[])` helper in editor-state that inspects the block contents and determines the type based on marker pairs:
  - `module` / `moduleEnd`
  - `config` / `configEnd`
- Subscribe to code changes and keep `blockType` up to date for all code blocks.
- Add a new config compilation callback (`compileConfig`) wired up to `@8f4e/stack-config-compiler`.
- Add an editor-state config effect that:
  - Collects all `config` blocks.
  - Builds a config program source string.
  - Invokes `compileConfig`.
   - Applies the resulting JSON config object to the editor state via the state-manager, starting with:
     - `projectInfo.title`, `projectInfo.author`, `projectInfo.description`.
     - `project.runtimeSettings` / `state.compiler.runtimeSettings` (depending on final mapping).
     - `project.selectedRuntime` / `state.compiler.selectedRuntime`.
     - `project.memorySizeBytes`.
- Update the module compilation effect so it:
  - Runs **after** config has been (re)applied.
  - Sends only `module` blocks into the existing compiler pipeline, using any config-derived settings (e.g. compiler options) already present in state.

## Implementation Plan

### Step 1: Add `blockType` to `CodeBlockGraphicData`

- **Task**
  - Extend `CodeBlockGraphicData` in `packages/editor/packages/editor-state/src/types.ts` with:
    - `blockType: 'module' | 'config' | 'unknown';`
  - Ensure block creation/import paths initialise `blockType` (can be `'unknown'` initially).
- **Expected outcome**
  - Every code block has an explicit type, even if it is only inferred later.
- **Dependencies**
  - None (purely type-level change).

### Step 2: Implement `getBlockType` helper

- **Task**
  - In `packages/editor/packages/editor-state/src/helpers/codeParsers.ts`, add:
    - `export function getBlockType(code: string[]): 'module' | 'config' | 'unknown'`
  - Implement detection via simple line scanning:
    - `hasModule = code.some(line => /^\s*module(\s|$)/.test(line));`
    - `hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));`
    - `hasConfig = code.some(line => /^\s*config(\s|$)/.test(line));`
    - `hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));`
  - Return:
    - `'module'` if `hasModule && hasModuleEnd && !hasConfig && !hasConfigEnd`
    - `'config'` if `hasConfig && hasConfigEnd && !hasModule && !hasModuleEnd`
    - `'unknown'` otherwise (including mixed or incomplete markers).
- **Expected outcome**
  - A reusable helper that classifies a block based solely on its code contents.
- **Dependencies**
  - None beyond existing helpers like `getModuleId`.

### Step 3: Subscribe to code changes and update `blockType`

- **Task**
  - Create a new effect, e.g. `packages/editor/packages/editor-state/src/effects/codeBlocks/blockTypeUpdater.ts`:
    - On `codeBlockAdded`:
      - Set `codeBlock.blockType = getBlockType(codeBlock.code);`
    - On `projectLoaded`:
      - Iterate `state.graphicHelper.codeBlocks` and recompute each `block.blockType`.
    - Subscribe to:
      - `store.subscribe('graphicHelper.selectedCodeBlock.code', ...)`:
        - If `selectedCodeBlock` exists, recompute its `blockType` using `getBlockType`.
  - Register this effect alongside existing editor-state effects.
- **Expected outcome**
  - `blockType` stays in sync with the actual code contents as the user edits blocks or loads projects.
- **Dependencies**
  - Step 2 (`getBlockType`).

### Step 4: Highlight config markers in the editor

- **Task**
  - In `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`, extend `instructionsToHighlight` with:
    - `'config'`
    - `'configEnd'`
- **Expected outcome**
  - Config blocks visually stand out in the editor and feel first-class alongside module blocks.
- **Dependencies**
  - None (purely visual).

### Step 5: Route only module blocks into the existing compiler

- **Task**
  - Update `flattenProjectForCompiler` in `packages/editor/packages/editor-state/src/effects/compiler.ts`:
    - Before sorting, filter by `blockType`:
      - `Array.from(codeBlocks)`
        - `.filter(block => block.blockType === 'module')`
        - `.sort((a, b) => a.creationIndex - b.creationIndex)`
        - `.map(block => ({ code: block.code }));`
- **Expected outcome**
  - Config blocks are excluded from the WASM compilation pipeline, avoiding spurious errors and keeping the compiler’s mental model clean.
- **Dependencies**
  - Step 1 (`blockType`), Step 3 (up-to-date classification).

### Step 6: Extend callbacks with a config compile callback

- **Task**
  - In `packages/editor/packages/editor-state/src/types.ts`, extend `Callbacks`:
    - Add:
      - `compileConfig?: (source: string) => Promise<{ config: unknown; errors: { line: number; message: string }[] }>;`
  - This should align closely with `@8f4e/stack-config-compiler`’s `CompileResult`.
- **Expected outcome**
  - A well-typed hook for the editor to delegate config compilation to the host app.
- **Dependencies**
  - None (can be added in parallel).

### Step 7: Implement `compileConfig` in the app shell

- **Task**
  - Add `src/config-callback.ts` in the root app:
    - Import: `import { compileConfig as compileStackConfig } from '@8f4e/stack-config-compiler';`
    - Export:
      - `export async function compileConfig(source: string) { return compileStackConfig(source); }`
  - In `src/editor.ts` (where `Callbacks` are passed to editor-state):
    - Provide `compileConfig` in the callbacks object.
- **Expected outcome**
  - The editor can call into `compileConfig` to turn config programs into JSON without embedding stack-config logic directly into editor-state.
- **Dependencies**
  - Step 6 (callback type).

### Step 8: Add an editor-state config effect to invoke `compileConfig` and update state

- **Task**
  - Create `packages/editor/packages/editor-state/src/effects/config.ts`:
    - Implement a `rebuildConfig` function that:
      - Collects all `config` blocks from `state.graphicHelper.codeBlocks`.
      - For each block, extracts the body between `config` and `configEnd` (simple slice between first/next markers).
      - Uses the stack-config language features (see `docs/brainstorming_notes/013-stack-oriented-config-language.md`), in particular:
        - `scope` / `rescope` / `endScope` for initial path setup.
        - `rescopeTop` to change only the last segment of the scope so we don't have to repeat the full path for related fields.
        - `set` / `append` to assign values and build arrays.
      - Chooses a strategy (to decide explicitly):
        - **Option A (global config)**: concatenate all config bodies into a single program (one global JSON config).
        - **Option B (per-block config)**: compile each block separately and merge JSON objects (e.g. deep merge with last-wins semantics).
      - Builds a `source: string` from the chosen strategy and calls:
        - `const result = await state.callbacks.compileConfig?.(source);`
      - Handles errors:
        - If `result.errors.length > 0`, surface them:
          - Potentially map errors back into `codeBlock.extras.errorMessages` or a dedicated config error store.
      - On success:
        - Take `result.config` and apply it to `State` via the state-manager:
          - Implement a small mapping layer from config paths → fields on `State` (e.g. `settings.runtime.sampleRate`, `featureFlags.demoMode`, etc.).
    - Wire `rebuildConfig` to:
      - `events.on('codeBlockAdded', rebuildConfig);`
      - `events.on('deleteCodeBlock', rebuildConfig);`
      - `events.on('projectLoaded', rebuildConfig);`
      - `store.subscribe('graphicHelper.selectedCodeBlock.code', rebuildConfig);`
- **Expected outcome**
  - Config blocks dynamically update the editor state whenever they change, leveraging the existing state-manager flow.
- **Dependencies**
  - Steps 1–3 (classification), 5 (separation from module compiler), 6–7 (callback).

### Example: Optimised `audioLoopback` Config Block

Using `scope`/`rescopeTop` to avoid repeating long paths, an `audioLoopback`-style project could express its configuration as:

```txt
config

; --- Project metadata ---
scope "projectInfo"
  scope "title"
  push "Audio Loopback"
  set

  rescopeTop "author"
  push "Andor Polgar"
  set

  rescopeTop "description"
  push ""
  set
endScope

; --- Memory size ---
rescope "memorySizeBytes"
push 65536
set

; --- Runtime selection ---
rescope "selectedRuntime"
push 0
set

; --- Runtime[0] basic fields ---
rescope "runtimeSettings[0]"

  scope "runtime"
  push "AudioWorkletRuntime"
  set

  rescopeTop "sampleRate"
  push 44100
  set

  ; --- Audio output buffers ---
  rescopeTop "audioOutputBuffers[0]"
  scope "moduleId"
  push "audiooutL"
  set

  rescopeTop "memoryId"
  push "buffer"
  set

  rescopeTop "channel"
  push 0
  set

  rescopeTop "output"
  push 0
  set

  rescopeTop "audioOutputBuffers[1]"
  scope "moduleId"
  push "audiooutR"
  set

  rescopeTop "memoryId"
  push "buffer"
  set

  rescopeTop "channel"
  push 1
  set

  rescopeTop "output"
  push 0
  set

  ; --- Audio input buffers ---
  rescopeTop "audioInputBuffers[0]"
  scope "moduleId"
  push "audioin"
  set

  rescopeTop "memoryId"
  push "buffer"
  set

  rescopeTop "channel"
  push 0
  set

  rescopeTop "input"
  push 0
  set

configEnd
```

This should compile (via `@8f4e/stack-config-compiler`) to a JSON object that can be mapped directly onto:

- `projectInfo.title`, `projectInfo.author`, `projectInfo.description`
- `memorySizeBytes`
- `selectedRuntime`
- `runtimeSettings[0]` (including `runtime`, `sampleRate`, `audioOutputBuffers`, `audioInputBuffers`)

Note: this is shown as a single, large `config` block for clarity, but the same configuration can be split across multiple smaller `config` blocks (for example, one block for project metadata, one for runtime selection, and one for audio routing). The editor-state config effect should support concatenating or otherwise merging multiple config blocks into a single effective config object.

## Success Criteria

- [ ] Code blocks are classified as `module`, `config`, or `unknown` based on their contents.
- [ ] Only `module` blocks are routed into the WASM compiler.
- [ ] `config` blocks are compiled via `compileConfig` into a JSON object.
- [ ] The resulting config JSON is applied to editor state through the state-manager.
- [ ] At minimum, config blocks can set:
  - [ ] `projectInfo.title`, `projectInfo.author`, `projectInfo.description`.
  - [ ] Runtime-related settings (`runtimeSettings`, `selectedRuntime`).
  - [ ] `memorySizeBytes`.
- [ ] Example projects in `src/examples` have been updated to express these fields via config blocks rather than hard-coded project fields.
- [ ] Once migration is complete, the corresponding fields are removed or minimised from the `Project` type where appropriate, with config considered the source of truth.
- [ ] Config compilation errors are surfaced to the user (e.g. inline error messages or a dedicated panel).
- [ ] Existing projects without `config` blocks continue to work unchanged.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts`
  - Add `blockType` to `CodeBlockGraphicData` and extend `Callbacks`.
- `packages/editor/packages/editor-state/src/helpers/codeParsers.ts`
  - New `getBlockType` helper.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/blockTypeUpdater.ts` (new)
  - Subscribes to code changes and keeps `blockType` in sync.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`
  - Adds `config`/`configEnd` to `instructionsToHighlight`.
- `packages/editor/packages/editor-state/src/effects/compiler.ts`
  - Filters out non-module blocks from `flattenProjectForCompiler`.
- `packages/editor/packages/editor-state/src/effects/config.ts` (new)
  - Invokes `compileConfig` and applies JSON config to state.
- `src/config-callback.ts` (new)
  - App-shell wrapper around `@8f4e/stack-config-compiler`.
- `src/editor.ts`
  - Wires `compileConfig` into editor-state callbacks.

## Risks & Considerations

- **Risk 1: Ambiguous or mixed blocks**
  - Blocks containing both `module` and `config` markers will currently be classified as `unknown`.
  - Mitigation: either validate and surface errors for such blocks or keep them ignored by both module and config pipelines.
- **Risk 2: Config/state mapping complexity**
  - Mapping arbitrary JSON into `State` may become complex or brittle.
  - Mitigation: start with a small, well-defined schema for config (a few specific paths) and expand deliberately with tests.
- **Dependencies**
  - `@8f4e/stack-config-compiler` should be stable and available in the app shell.
  - Editor-state effects wiring must be updated carefully to avoid regressions.
- **Breaking Changes**
  - None expected if `blockType` defaults to `'unknown'` and existing blocks continue to be recognised as `module` when they contain `module`/`moduleEnd`.

## Related Items

- **Related**
  - `docs/todos/107-stack-config-compiler-package.md` (stack config compiler foundations)
  - `docs/usage.md` — may need updates to describe config blocks once implemented.

## References

- `packages/stack-config-compiler/src/index.ts` — `compileConfig` entry point and semantics.
- `src/compiler-callback.ts` — pattern for hooking the compiler into a worker-backed callback.
- `packages/editor/packages/editor-state/src/effects/compiler.ts` — current module compilation effect.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` — code block creation behaviour.

## Notes

- Initial implementation can keep config compilation on the main thread; if it proves heavy, mirror the worker-based pattern used by the module compiler.
- Config block syntax and schema can evolve; the key is to keep the detection/routing layer isolated so future changes to the config language don’t disturb the core editor/compiler pipeline.
