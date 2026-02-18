---
title: 'TODO: Switch regular project export/import to .8f4e text format'
priority: High
effort: 1-2d
created: 2026-02-18
status: Open
completed: null
---

# TODO: Switch regular project export/import to .8f4e text format

## Problem Description

Regular project export/import currently uses JSON (`project.json`) with `codeBlocks[].code` as `string[]`.
The desired format is a dedicated `.8f4e` project file where each code block is stored as a single string block in a plain-text payload.

## Agreed Decisions

- This is a breaking format change.
- No backward compatibility is required (no `.json` regular import support).
- `.8f4e` regular export/import only.
- Built-in examples should also be converted to `.8f4e` format.
- Example projects should be real `.8f4e` files on disk and loaded as raw text via Vite `?raw`.
- Use one shared `.8f4e` parser/serializer for both user import/export and bundled example loading.
- Runtime-ready export remains JSON for now.
- Export must fail if any code block is invalid/incomplete.

## .8f4e v1 Format

Header:
- First line must be exactly: `8f4e/v1`

Body:
- Followed by zero or more source blocks separated by blank lines.
- Each block is stored as raw multi-line source text (single string payload conceptually).
- Block boundaries are inferred from language markers.

Recognized openers:
- `module`
- `function`
- `config`
- `constants`
- `defineMacro`
- `vertexShader`
- `fragmentShader`
- `comment`

Recognized closers:
- `moduleEnd`
- `functionEnd` (including forms like `functionEnd float`)
- `configEnd`
- `constantsEnd`
- `defineMacroEnd`
- `vertexShaderEnd`
- `fragmentShaderEnd`
- `commentEnd`

## Validation Rules (Export Gate)

Export should be rejected if any code block violates rules:
- Missing opener or missing matching closer.
- Opener/closer mismatch.
- Closer not placed at the end of the block (ignoring trailing empty lines).
- Unknown opener/closer token.
- Mixed block type markers within a single block.

Error messages should identify the failing block and reason.

## Scope

- Regular project export and import path only.
- Built-in examples project source format.
- Keep runtime-ready export behavior unchanged.
- Keep editor runtime state shape (`code: string[]`) unless refactor is explicitly requested later.
- Convert at file boundary:
  - Export: `string[]` -> joined block string (`\n`).
  - Import: block string -> `string[]` via line split.

## Implementation Plan

### Step 1: Add .8f4e serializer/parser helpers

- Add dedicated helper(s) for:
  - `Project` -> `.8f4e` text
  - `.8f4e` text -> `Project`
- Implement strict format validation and descriptive errors.

### Step 2: Switch regular export filename and payload

- In regular export effect, replace `project.json` with `project.8f4e`.
- Replace `JSON.stringify(project)` payload with `.8f4e` text payload.

### Step 3: Switch regular import to .8f4e only

- File picker accept: `.8f4e`.
- Parse selected text with new parser instead of `JSON.parse`.
- Return `Project` shape for existing load flow.

### Step 4: Keep runtime-ready export unchanged

- Keep runtime-ready filename and payload as JSON.
- Do not modify runtime-ready serializer contract in this task.

### Step 5: Tests

- Add/adjust tests for:
  - Valid `.8f4e` export from typical project.
  - Valid `.8f4e` import into `Project`.
  - Export rejection for incomplete blocks.
  - Export rejection for mismatched markers.
  - Import rejection for invalid header.
  - Import rejection for malformed block structure.
- Update existing tests that currently expect `project.json` in regular export path.

### Step 6: Convert bundled examples to .8f4e

- Replace current TS-embedded `Project` literals in examples with `.8f4e` source files.
- Load example `.8f4e` files via Vite raw imports (`?raw`).
- Parse loaded text with the shared `.8f4e` parser into `Project` at load time.
- Ensure existing example metadata/registry behavior stays unchanged.
- Update tests/fixtures that rely on old examples JSON-like project shape.

## Success Criteria

- [ ] Regular export produces `project.8f4e` text payload.
- [ ] Regular import accepts only `.8f4e` and reconstructs `Project`.
- [ ] Invalid/incomplete code blocks prevent export with clear errors.
- [ ] Runtime-ready export remains JSON and unchanged.
- [ ] Built-in examples load from `.8f4e` sources and behave the same.
- [ ] Tests pass for new `.8f4e` flow.

## Affected Components

- `packages/editor/packages/editor-state/src/features/project-export/effect.ts`
- `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts`
- `src/storage-callbacks.ts`
- `packages/editor/packages/editor-state/src/features/project-export/__tests__/effect.test.ts`
- `packages/editor/packages/editor-state/src/features/project-import/__tests__/effect.test.ts` (if import behavior assertions are present)
- New helper module(s) under editor-state project import/export features
- `packages/examples/src/projects/*`
- `src/examples/exampleProjects.ts`
- `src/examples/registry.ts`
- `packages/examples/src/projects/*.8f4e` (new)

## Notes

- Runtime-ready export is intentionally left as JSON until that path is removed in a later change.
