---
title: 'TODO: Add config block type attribute for project config'
priority: High
effort: 1-2 days
created: 2026-01-21
status: Open
completed: null
---

# TODO: Add config block type attribute for project config

## Problem Description

We want a single `config` block marker with a required type to distinguish configuration scopes. Today, config blocks are identified only by `config` / `configEnd`, which provides no explicit type and blocks extending the system to multiple config categories.

## Proposed Solution

Require `config <type>` for all config blocks and implement the `project` type first. This replaces the previous idea of renaming markers to `projectConfig` and keeps `configEnd` as the closing marker. No backward compatibility is required; existing projects must be updated to use `config project`.

## Implementation Plan

### Step 1: Update block parsing and types
- Require `config <type>` markers (reject `config` without a type) at parsing/block-detection time
- Parse and store any `config <type>` value without validating the type at this layer
- Treat `config project` as the only supported compilation target for now while leaving parsing generic

### Step 2: Update config compilation pipeline
- Ensure config compilation only consumes `config project` blocks
- Reject other config types (editor, runtime) with a clear error until implemented (e.g. `Unsupported config type: <type>. Supported: project.`) and surface via config errors/inline block error
- Keep compiled config behavior unchanged for project exports

### Step 3: Update tests, examples, and docs
- Replace `config` with `config project` across examples, tests, and documentation
- Update any snapshots or fixtures that embed config blocks
- Add/adjust tests that enforce required type token

## Success Criteria

- [ ] `config` blocks without a type are rejected with a clear error
- [ ] `config project` blocks compile exactly as current config blocks do
- [ ] All tests and example projects use `config project` and pass

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` - marker detection
- `packages/editor/packages/editor-state/src/features/config-compiler/*` - parsing/combining/config compilation helpers
- `src/examples/projects/*` - embedded config blocks
- `docs/*` - usage documentation

## Risks & Considerations

- **Breaking Changes**: Existing saved projects must be updated to use `config project`
- **Test Churn**: Snapshot updates will be extensive
- **Future Types**: Keep error messaging clear for unsupported config types

## Related Items

- **Related**: `docs/todos/197-add-editor-config-blocks.md`
- **Related**: `docs/todos/198-fix-int8-highlight.md`

## References

- `docs/brainstorming_notes/archived/024-config-blocks-schema-validation.md`

## Notes

- Editor config blocks will be handled in a separate TODO.
