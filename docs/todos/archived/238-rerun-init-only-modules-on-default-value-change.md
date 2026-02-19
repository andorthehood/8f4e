---
title: 'TODO: Re-run init-only modules when default memory values change'
priority: Medium
effort: 4-6h
created: 2026-02-18
status: Completed
completed: 2026-02-19
---

# TODO: Re-run init-only modules when default memory values change

## Problem Description

Incremental recompiles currently update changed memory defaults directly in memory without re-running module init logic. Once `#initOnly` exists, this means init-only module code may become stale relative to updated defaults.

Current incremental flow in compiler-worker:
- Detect changed defaults (`getMemoryValueChanges`)
- Patch memory values directly
- Do not call wasm `init()` unless first compile or memory recreation

Needed behavior:
- When default memory values change in a way that affects init-only execution, re-run init-only module logic.
- For the first version, running all init-only modules is acceptable.

## Proposed Solution

Implement an incremental re-init path that runs all init-only modules after default updates.

High-level approach:
- Add/init compiler metadata for init-only modules.
- Expose a dedicated wasm export for init-only execution (separate from full `init`).
- In compiler-worker incremental path, after applying changed default values:
  - detect whether any relevant default changed,
  - call the dedicated init-only export once (running all init-only modules).

Rationale:
- Avoid calling full `init()` on incremental updates (would reinitialize unrelated memory).
- Keep first implementation simple by re-running all init-only modules.
- Leave per-module selective re-run as future optimization.

## Anti-Patterns

- Do not call full exported `init()` on every incremental default change.
- Do not reset all memory just to refresh init-only logic.
- Do not block this feature on per-module targeting in the first iteration.

## Implementation Plan

### Step 1: Compiler export support
- Add compiler support to emit an export that executes init-only modules only.
- Ensure this export is safe to call repeatedly.
- Keep existing `init` and `cycle` semantics unchanged.

### Step 2: Change detection hook
- Reuse `getMemoryValueChanges` output in compiler-worker.
- Add a guard to decide when to run init-only refresh.
- First pass: any memory default change triggers init-only refresh.

### Step 3: Worker execution flow
- In incremental path (`!needsInitialization`):
  - patch changed defaults into memory (existing behavior),
  - then call init-only export once.
- Keep first-compile / recreated-memory path unchanged (full `init()` still runs).

### Step 4: Tests
- Add compiler-worker tests for incremental recompiles:
  - default change triggers init-only rerun
  - no default change does not rerun
  - first compile still uses full `init()`
- Add integration checks that repeated reruns are stable and do not throw.

### Step 5: Documentation
- Document behavior and limitations:
  - all init-only modules rerun (not per-module yet)
  - triggered by incremental default changes
  - full init remains first-load / memory-recreate path

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler-worker:test`
- `rg -n "initOnly|runInitOnly|getMemoryValueChanges|compileAndUpdateMemory" /Users/andorpolgar/git/8f4e/packages/compiler /Users/andorpolgar/git/8f4e/packages/compiler-worker`

## Success Criteria

- [ ] Incremental default changes trigger one init-only rerun pass
- [ ] Full `init()` is not called for normal incremental updates
- [ ] Existing non-init-only incremental memory patching remains intact
- [ ] Compiler-worker tests cover the new branch
- [ ] Docs describe current all-modules rerun behavior

## Affected Components

- `packages/compiler/src/index.ts` - emit/init-only dispatcher export
- `packages/compiler/src/types.ts` - metadata as needed
- `packages/compiler-worker/src/compileAndUpdateMemory.ts` - incremental rerun hook
- `packages/compiler-worker/src/getMemoryValueChanges.ts` - reused change signal
- `packages/compiler-worker/src/types.ts` - optional result metadata if needed
- `packages/compiler/docs/directives.md` - behavior notes

## Risks & Considerations

- **Risk 1**: Extra runtime cost when many init-only modules exist.
  - Mitigation: acceptable for v1; optimize later with per-module reruns.
- **Risk 2**: Side effects in init-only code may run more frequently than before.
  - Mitigation: document rerun semantics clearly.
- **Risk 3**: Export/index shifts in wasm function layout.
  - Mitigation: cover with tests that instantiate and invoke exports.

## Related Items

- **Related**: `docs/todos/231-add-init-only-compiler-directive.md`
- **Future optimization**: per-module rerun targeting based on changed defaults

## Notes

- Agreed scope: rerun all init-only modules for now.
- Per-module rerun may be added later as a follow-up optimization.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
