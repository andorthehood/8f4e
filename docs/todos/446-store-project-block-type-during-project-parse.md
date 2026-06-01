---
title: 'TODO: Store project block type during project parse'
priority: Medium
effort: 2-4h
created: 2026-06-01
issue: null
status: Open
completed: null
---

# TODO: Store Project Block Type During Project Parse

## Problem Description

`parse8f4eProject()` already knows each document block opener while it reads the project file. Later, `pickProjectCompilerBlocks()` calls `getProjectBlockType(block.code)`, which scans the block again just to rediscover the type.

This is avoidable parser metadata. The project parser should carry the block type forward instead of forcing later consumers to infer it from raw source.

## Proposed Solution

Add `blockType` to `ProjectCodeBlock` and set it inside `parse8f4eProject()` from the opener that was already read.

For example:

```ts
export interface ProjectCodeBlock {
	code: string[];
	blockType: DocumentBlockType;
	disabled?: boolean;
	entry?: string;
}
```

Then `pickProjectCompilerBlocks()` can switch on `block.blockType` directly.

## Implementation Plan

### Step 1: Add Block Type Metadata

- Extend `ProjectCodeBlock` with a required `blockType`.
- Derive it from the opener in `readDocumentBlock(...)`.
- Keep module entry handling unchanged.

### Step 2: Remove Redetection in Compiler Block Picking

- Replace `getProjectBlockType(block.code)` in `pickProjectCompilerBlocks()` with `block.blockType`.
- Update tests and snapshots that assert parsed project block shapes.

### Step 3: Review Editor/CLI Callers

- Update project import/export and CLI callers for the new required field.
- Do not preserve old shapes through compatibility shims.

## Success Criteria

- [ ] `pickProjectCompilerBlocks()` no longer scans block source to identify block type.
- [ ] Project parser tests assert the parser-produced `blockType`.
- [ ] CLI project compile/test flows still pass.
- [ ] Editor project import/export behavior remains unchanged.

## Affected Components

- `packages/compiler/packages/tokenizer/src/project.ts`
- `packages/compiler/packages/tokenizer/src/project.test.ts`
- `packages/cli/src/`
- `packages/editor/packages/editor-state/src/features/project-import/`
- `packages/editor/packages/editor-state/src/features/project-export/`

## Risks & Considerations

- **Serialized shape**: Confirm whether `ProjectCodeBlock` objects are persisted directly anywhere or only created in memory from `.8f4e` import/editor state.
- **Existing editor metadata**: The editor already has code block `blockType` in graphic data; keep the project parser field simple and do not mix it with graphic data.
- **No compatibility burden**: The software has not been released yet, so update internal APIs directly and do not add compatibility shims.

