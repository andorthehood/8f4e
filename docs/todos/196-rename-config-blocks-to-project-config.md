---
title: 'TODO: Rename config blocks to projectConfig'
priority: High
effort: 1-2 days
created: 2026-01-21
status: Open
completed: null
---

# TODO: Rename config blocks to projectConfig

## Problem Description

The current stack-config block markers are named `config` / `configEnd`, which makes it hard to distinguish project runtime configuration from editor-only configuration. We want to introduce a separate editor configuration block type, so the existing name is too generic and creates ambiguity.

## Proposed Solution

Rename the block markers and block type from `config` to `projectConfig` across the editor, compiler pipeline, examples, tests, and docs. No backward compatibility is required; all existing usages should be updated.

## Implementation Plan

### Step 1: Update block parsing and types
- Replace `config` / `configEnd` marker detection with `projectConfig` / `projectConfigEnd`
- Update `CodeBlockType` and any block-type detection logic
- Update config block collection/combine/extract utilities to use the new markers

### Step 2: Update tests, examples, and docs
- Update all example projects and snapshots that embed config blocks
- Update tests that reference config markers or block types
- Update documentation references to the old markers

### Step 3: Verify end-to-end behavior
- Ensure config compilation still works with the new markers
- Verify error mapping still attributes to the correct blocks
- Confirm that project exports include compiled config as before

## Success Criteria

- [ ] All references to `config` / `configEnd` markers removed in favor of `projectConfig` / `projectConfigEnd`
- [ ] Tests and snapshots updated and passing
- [ ] Example projects compile with the renamed blocks

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` - marker detection
- `packages/editor/packages/editor-state/src/features/config-compiler/*` - parsing/combining/config compilation helpers
- `src/examples/projects/*` - embedded config blocks
- `docs/*` - usage documentation

## Risks & Considerations

- **Breaking Changes**: Existing saved projects with `config` blocks will no longer be recognized
- **Test Churn**: Snapshot updates will be extensive
- **Coordination**: Any external users must update their config blocks

## Related Items

- **Related**: TODO: Introduce editorConfig blocks with separate schema (see next TODO)

## References

- `docs/brainstorming_notes/archived/024-config-blocks-schema-validation.md`

## Notes

- Explicitly no backward compatibility; all usages must be updated in one sweep.
