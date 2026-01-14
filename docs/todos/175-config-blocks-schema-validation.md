---
title: 'TODO: Validate Config Blocks as One Source'
priority: Medium
effort: 2-4h
created: 2026-01-14
status: Open
completed: null
---

# TODO: Validate Config Blocks as One Source

## Problem Description
Config blocks are compiled independently and deep-merged, which prevents full-schema validation. Missing required fields and combinator checks (oneOf/anyOf) require the complete merged config, so the current flow can miss or misreport schema errors.

## Proposed Solution
Compile all config blocks as a single combined source for validation, then map compiler error lines back to the originating block using line ranges.

## Implementation Plan

### Step 1: Build a combined config source
- Concatenate config block sources in creation order with a blank line separator.
- Track `{ blockId, startLine, endLine }` for each block using `creationIndex`.

### Step 2: Compile once and map errors
- Call `compileConfig(source, configSchema)` once.
- Map returned error lines to `blockId` and adjust to block-local line numbers for UI errors.

### Step 3: Apply compiled config
- Use the returned config directly, then merge over `defaultConfig` as today.
- Ensure exported runtime-ready config uses the same combined flow.

## Success Criteria

- [ ] Schema validation runs against the fully merged config
- [ ] Errors display on the correct config block with accurate line numbers
- [ ] No regressions in config export behavior

## Affected Components

- `packages/editor/packages/editor-state/src/effects/config.ts` - change compile flow and error mapping
- `packages/editor/packages/editor-state/src/pureHelpers/config/collectConfigBlocks.ts` - source aggregation and line mapping

## Risks & Considerations

- **Error mapping**: Schema-wide errors reported at line 1 will land on the first block unless specially handled
- **Behavior change**: Per-block merge semantics replaced by full-source compile; verify with existing tests

## Related Items

- **Related**: `docs/brainstorming_notes/024-config-blocks-schema-validation.md`

## Notes

- Use `creationIndex` as `codeBlockId` for config errors to match UI error routing.
