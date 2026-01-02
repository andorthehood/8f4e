---
title: 'TODO: Disable Compilation for Runtime-Ready Projects'
priority: Medium
effort: 3-5h
created: 2026-01-02
status: Open
completed: null
---

# TODO: Disable Compilation for Runtime-Ready Projects

## Problem Description

Runtime-ready projects can ship with precompiled assets (compiled config, compiled modules, compiled WASM, memory snapshots), but the editor currently still attempts to compile when loading or updating. This causes unnecessary work and can fail in environments without compiler support. We need a config flag that hard-blocks compilation for runtime-ready projects, regardless of whether those compiled artifacts are present.

## Proposed Solution

Add a new config schema field `disableCompilation` (boolean) that, when set, prevents any compilation work from running. The flag should be enforced at the editor-state level so that both project compilation and config compilation are blocked consistently. Runtime-ready export paths should respect this flag and avoid triggering compilation. The system should surface a clear error or log message when compilation is skipped due to this flag.

Alternative approaches considered:
- Inferring runtime-ready mode based on presence of compiled artifacts. Rejected because the requirement is to hard-block compilation even if artifacts are missing.
- Tying the behavior to project type instead of config. Rejected because config is the intended control surface.

## Implementation Plan

### Step 1: Extend schema and types
- Add `disableCompilation?: boolean` to `packages/editor/packages/editor-state/src/configSchema.ts`.
- Update config-related type(s) to include the new flag where the config object is represented (likely in `packages/editor/packages/editor-state/src/impureHelpers/config/applyConfigToState.ts` and/or `packages/editor/packages/editor-state/src/types.ts`).
- Ensure schema validation allows the field and does not accept additional properties beyond schema.

### Step 2: Enforce flag in compilation flows
- Block project compilation when `disableCompilation` is true (likely in editor-state effects that call `compileProject`).
- Block config compilation in `packages/editor/packages/editor-state/src/effects/config.ts` and in `compileConfigForExport` to prevent runtime-ready export from compiling config when disabled.
- Add a structured log or error entry when compilation is blocked so users understand why it did not run.

### Step 3: Update runtime-ready export and project loading behaviors
- Ensure runtime-ready export does not attempt to compile config or modules when the flag is set.
- Confirm project load paths do not trigger compilation in runtime-ready mode.
- Make sure any UI signals or error states remain consistent when compilation is skipped.

### Step 4: Tests and verification
- Add tests asserting that compilation callbacks are not invoked when `disableCompilation` is set.
- Add tests for runtime-ready export to ensure compiled artifacts are not regenerated when disabled.
- Update or add snapshot expectations for export outputs if needed.

## Success Criteria

- [ ] Projects with `disableCompilation: true` do not call any compile callbacks.
- [ ] Runtime-ready exports with the flag set do not attempt to compile config or modules.
- [ ] A clear log or error message is emitted when compilation is skipped.
- [ ] Relevant tests cover the new behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/configSchema.ts` - Add `disableCompilation` field.
- `packages/editor/packages/editor-state/src/effects/config.ts` - Block config compilation paths.
- `packages/editor/packages/editor-state/src/effects/compiler.ts` - Block project compilation paths.
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToRuntimeReadyProject.ts` - Avoid config compilation when disabled.
- `src/config-callback.ts` and `src/editor.ts` - Ensure callback wiring remains compatible with new flag behavior.

## Risks & Considerations

- **Risk 1**: Skipping compilation could hide missing or stale artifacts; mitigate by logging a clear warning and keeping behavior explicit.
- **Risk 2**: Some workflows may rely on compilation even for runtime-ready projects; mitigate with clear docs and tests.
- **Dependencies**: None, but should coordinate with any ongoing changes to runtime-ready export flows.
- **Breaking Changes**: None expected; new flag is opt-in.

## Related Items

- **Depends on**: None.
- **Related**: `docs/todos/042-enable-runtime-only-project-execution.md` (runtime-ready execution), `docs/todos/036-editor-config-testing-completion.md`.

## References

- `packages/editor/packages/editor-state/src/configSchema.ts`
- `packages/editor/packages/editor-state/src/effects/config.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToRuntimeReadyProject.ts`

## Notes

- Consider whether the flag should be saved in project JSON or only in compiled config.
- Confirm expected behavior when `disableCompilation` is set but compiled artifacts are missing.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
