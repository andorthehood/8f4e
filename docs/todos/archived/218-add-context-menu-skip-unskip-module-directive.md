---
title: 'TODO: Add context-menu action to skip/unskip module execution'
priority: Medium
effort: 3-5h
created: 2026-02-10
status: Completed
completed: 2026-02-10
---

# TODO: Add context-menu action to skip/unskip module execution

## Problem Description

The module context menu already provides an enable/disable code-block action, but there is no direct UI action for toggling module execution skipping via the compiler directive.

Users should be able to skip or unskip module runtime execution without manually editing code.

## Proposed Solution

Add a module-only context-menu action that toggles the `#skipExecution` compiler directive inside the selected module block:
- If missing: insert `#skipExecution` directly below the `module <name>` line.
- If present: remove the directive line(s).

This action changes source code, not just editor runtime flags, so behavior is persisted in project code.

Current compiler implementation detail (already merged):
- `#skipExecution` is handled as an instruction token (`instructionCompilers/skipExecution.ts`), not as a standalone pre-pass.
- Module metadata is stored on `CompiledModule.skipExecutionInCycle`.
- Cycle dispatcher generation in compiler skips modules with that flag.

## Implementation Plan

### Step 1: Menu action
- Update `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`.
- Show action only for `blockType === 'module'`.
- Do not show action for `unknown` block type (including malformed `module <name>` headers).
- Label should be dynamic:
  - `Skip module` when directive is absent
  - `Unskip module` when directive is present
- Hook action to a new event (for example `toggleModuleSkipExecutionDirective`).

### Step 2: Code mutation handler
- Implement handler in `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`.
- Reuse existing mutation patterns (`featureFlags.editing` guard, `lastUpdated` update, store write for rerender).
- Toggle behavior:
  - insert directive after module header
  - remove directive when present (remove all matching lines for cleanup/idempotence)
- Detection should match compiler syntax behavior:
  - use a shared directive helper exported from `@8f4e/compiler/syntax` (required)
  - treat indented `#skipExecution` as valid
  - match exact instruction token `#skipExecution`

### Step 3: Align compiler with shared helper
- Update compiler directive parsing/detection to use the same shared helper from `@8f4e/compiler/syntax`.
- Remove/avoid ad-hoc duplicate directive parsing logic in compiler code.
- Ensure compiler and editor rely on one canonical directive parsing contract.

### Step 4: Tests and docs
- Add menu tests for visibility and label switching.
- Add effect tests for insertion/removal behavior and edit-disabled guard.
- Add/adjust compiler tests to assert shared helper-driven directive detection behavior.
- Add/update docs entry that module skip can be toggled from context menu.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "toggleModuleSkipExecutionDirective|#skipExecution|Skip module|Unskip module" packages/editor/packages/editor-state/src`
- `npx nx run compiler:test -- --run skipExecution.test.ts`

## Success Criteria

- [ ] Module context menu offers skip/unskip action.
- [ ] Action inserts `#skipExecution` directly below module declaration.
- [ ] Action removes directive on unskip.
- [ ] Non-module blocks do not show this action.
- [ ] Malformed module headers (resulting in `unknown` block type) do not show this action.
- [ ] Tests cover menu label logic and code mutation behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/*` (if helper added)
- `packages/editor/packages/editor-state/src/features/**/__tests__/**`
- `packages/editor/docs/editor-directives.md`
- `packages/compiler/src/instructionCompilers/skipExecution.ts` (reference behavior)
- `packages/compiler/src/index.ts` (reference cycle skip behavior)
- `packages/compiler/src/types.ts` (`skipExecutionInCycle` metadata)
- `packages/compiler/src/syntax/*` (shared directive parsing helper exports required by editor)

## Risks & Considerations

- **Incorrect insertion point**: directive must be placed under `module <name>` line, not elsewhere.
- **Duplicate directives**: unskip should clean all duplicates to normalize code.
- **Scope safety**: menu action must be hidden for non-module blocks to avoid invalid edits.

## Related Items

- **Related**: `docs/todos/217-add-first-compiler-directive-skip-module-execution.md`
- **Related**: `docs/todos/216-stop-treating-hash-as-compiler-comment.md`

## Notes

- Keep editor-side detection aligned with current compiler parsing (`#skipExecution` as instruction token).
- A dedicated shared directive helper in `@8f4e/compiler/syntax` is required for this feature to avoid parsing drift between compiler and editor.
- Compiler code must also consume this shared helper; editor-only adoption is not sufficient.
- This feature relies on block type detection: only `module` blocks expose skip/unskip. Malformed module headers should classify as `unknown` and therefore never show the action.
