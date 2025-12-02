# Plan: Surface config compilation errors in graphicHelper

Goals
- Surface compiler errors in the semi-visual editor so users immediately see what’s wrong and where.
- Keep signal-to-noise high during live editing (low flicker, clear deduping).
- Provide both inline context (on nodes/ports) and a global overview (panel/log).

Overview of existing module error flow
- Compile call: `state.callbacks.compileProject(modules, compilerOptions)` in `packages/editor/packages/editor-state/src/effects/compiler.ts`.
- On failure, errors are normalized into `state.compiler.compilationErrors` with `{ lineNumber, moduleId, code, message }` and `'compilationError'` is dispatched.
- `graphicHelper` listens to `'compilationError'` and updates visuals; decorators like `gaps` and `errorMessages` render inline markers and messages filtered by `moduleId`.

Mirror for config compilation errors
1) Data model
- Add `state.configCompiler.compilationErrors: Array<{ lineNumber: number; moduleId: string; code: number; message: string }>`. 
- Normalize thrown errors from the config compiler to the same shape as module errors.

2) Events
- Emit `'configCompilationError'` after a failed config compile.
- Emit `'configBuildFinished'` after a successful config compile (to clear error visuals).

3) graphicHelper hooks
- In `graphicHelper`, add:
  - `events.on('configCompilationError', updateGraphicsAll)`
  - `events.on('configBuildFinished', updateGraphicsAll)`
- Decorators:
  - `gaps`: read both sources; for each `CodeBlockGraphicData`, apply gaps from `state.compiler.compilationErrors` when `blockType === 'module'`, and from `state.configCompiler.compilationErrors` when `blockType === 'config.`
  - `errorMessages`: render messages from the appropriate source based on `blockType` and `moduleId`.

4) Identifier mapping
- `CodeBlockGraphicData.id` is set via `getModuleId(graphicData.code)`; `moduleId` in errors must match this ID for modules.
- For config blocks, confirm ID derivation:
  - If `getModuleId` works, reuse it; otherwise introduce `getConfigId` and ensure the config compiler populates `moduleId` to match.

5) UX parity
- Inline markers: a small gap at `lineNumber` and an error message overlay in the code block.
- Global panel (optional): filters for “Config” vs “Module” errors; clicking entries centers the viewport on the block.

6) Lifecycle
- On config compile start: optional status indicator.
- On config compile error:
  - Populate `state.configCompiler.compilationErrors`.
  - Dispatch `'configCompilationError'`.
- On config compile success:
  - Clear `state.configCompiler.compilationErrors`.
  - Dispatch `'configBuildFinished'`.

7) Edge cases
- `moduleId` is empty or doesn’t match any block:
  - Show as a global config error (panel-only) or attach to a dedicated “Config” pseudo-block.
- Multiple errors:
  - Support arrays; dedupe by `moduleId + lineNumber + code + message`.

8) Performance & accessibility
- Debounce redraws during rapid edits (e.g., 150–300ms) to avoid UI thrash.
- Batch DOM/canvas updates and only rerender affected blocks.
- Ensure contrast on error markers; support keyboard navigation and tooltips.

Open questions
- Should config compile errors block run/export, or just warn?
- Do we need per-node error panes, or is the global panel plus tooltips sufficient?
- What’s the fidelity of mapping between config code and block IDs—do we need better source maps first?
- Should errors persist across sessions or clear on reload?

References
- `packages/editor/packages/editor-state/src/effects/compiler.ts` produces `state.compiler.compilationErrors` and emits `'compilationError'`.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` sets `CodeBlockGraphicData.id` via `getModuleId(code)` and listens to `'compilationError'`.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/gaps.ts` inserts visual gaps for matching `moduleId` and `lineNumber`.
- `packages/editor/packages/editor-state/src/types.ts` defines `CodeBlockGraphicData.extras.errorMessages` for inline textual errors.
