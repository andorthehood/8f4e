---
title: 'TODO: Remove runtime packaging concerns from CLI'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Completed
completed: 2026-03-16
---

# TODO: Remove runtime packaging concerns from CLI

## Problem Description

The CLI currently does more than compile/build the program. It also compiles and packages runtime-facing project configuration, including runtime-specific settings and runtime host selection.

That creates a blurred boundary:

- the compiler/CLI path should build program artifacts
- the editor/export path should own runtime host selection and runtime-ready packaging

This became more obvious while migrating runtime selection to editor config `; @config runtime <id>`. The CLI had to learn about editor-owned runtime selection only because it still emits `compiledProjectConfig` as part of its output. That is the wrong responsibility split if the CLI is intended to build projects rather than prepare them for execution.

## Proposed Solution

Narrow the CLI to program-build concerns only.

The target end state should be:

- CLI compiles modules and wasm
- CLI reports required memory bytes
- CLI does not resolve editor directives such as `@config runtime`
- CLI does not compile/export runtime-ready `compiledProjectConfig`
- runtime-ready packaging remains in editor/export-specific code paths

This likely means removing or redesigning the current `compiledProjectConfig` output from `packages/cli`.

## Anti-Patterns

- Do not keep adding editor/runtime-host concepts to the CLI just because exported fixtures currently depend on them.
- Do not move runtime factory or runtime registry concerns into the CLI.
- Do not treat runtime host selection as part of compiler semantics.

## Implementation Plan

### Step 1: Inventory current CLI runtime packaging surface

- Audit `packages/cli/src/` for config compilation, runtime defaults, and runtime-ready export fields.
- Identify which outputs are pure build artifacts versus runtime packaging artifacts.

### Step 2: Remove runtime config compilation from CLI

- Stop compiling project runtime config in the main CLI build path.
- Remove `@config runtime` and runtime default resolution from CLI config compilation.
- Decide whether config-related code should be deleted or moved into a different export-specific layer.

### Step 3: Redefine CLI output shape

- Remove `compiledProjectConfig` from CLI outputs if the CLI is truly build-only.
- Keep program artifacts such as compiled modules, wasm, and required memory bytes.
- Update fixtures, tests, and snapshots accordingly.

### Step 4: Align docs and boundaries

- Update CLI docs to describe it as a build tool rather than a runtime-ready packager.
- Clarify that runtime-ready export belongs to editor/export flows.

## Validation Checkpoints

- `rg -n "compiledProjectConfig|runtimeSettings|@config runtime|defaultProjectConfig" packages/cli`
- `npx nx run @8f4e/cli:test`
- `npx nx run @8f4e/cli:typecheck`

## Success Criteria

- [x] CLI no longer resolves editor-owned runtime selection such as `@config runtime`.
- [x] CLI no longer packages runtime config as part of normal build output.
- [x] CLI tests and snapshots reflect a build-only output contract.
- [x] Runtime-ready export still works through the editor/export path.

## Affected Components

- `packages/cli/src/` - remove runtime packaging/config concerns
- `packages/cli/tests/` - update fixtures and snapshots
- `packages/editor/packages/editor-state/src/features/project-export/` - keep runtime-ready export responsibility here
- `packages/examples/` - adjust any CLI-facing fixtures if they assume packaged runtime config

## Risks & Considerations

- **Breaking Changes**: CLI output shape will change if `compiledProjectConfig` is removed.
- **Test Fallout**: Existing CLI fixtures/snapshots currently expect runtime-ready output.
- **Boundary Clarity**: This refactor should improve architecture, but only if the docs and tests are updated to match.

## Related Items

- **Related**: `311-derive-memory-size-from-compiled-program-footprint.md`
- **Related**: runtime selection migration to editor config `@config runtime`

## Notes

- This TODO exists because the current CLI still carries runtime/export concerns that belong to the editor/export pipeline.
