# TODO: Remove Project Parameter from initEditor Function

**Priority**: 🟡
**Estimated Effort**: 1-2 days
**Created**: 2024-12-29
**Status**: Completed
**Completed**: 2025-01-11

## Problem Description

Currently, the `initEditor` function requires a `project` object to be passed as a separate argument:

```typescript
const editor = await initEditor(canvas, project, options);
```

This creates several issues:
- **Inconsistent API**: The editor has callbacks for most functionality but still requires a project upfront
- **Redundant Logic**: Project selection logic is duplicated in consumer code
- **Tight Coupling**: The editor depends on external project selection logic
- **Complex Initialization**: Consumers must handle both project selection and editor initialization

## Proposed Solution

Remove the `project` parameter from `initEditor` and use the existing `loadProjectFromStorage` callback as the primary source for the initial project. The editor will handle creating an empty default project internally when storage is empty.

**Priority Order:**
1. Storage (via `loadProjectFromStorage` callback)
2. Empty default project (handled internally by editor)

## Implementation Plan

### Step 1: Update Options Interface
- Modify `packages/editor/src/state/types.ts`
- Make `loadProjectFromStorage` required (remove optional `?`)
- Remove any need for `defaultProjectSlug` or similar parameters

### Step 2: Update initEditor Function Signature
- Modify `packages/editor/src/index.ts`
- Remove `project: Project` parameter
- Update function signature to `init(canvas: HTMLCanvasElement, options: Options)`

### Step 3: Implement Project Loading Logic
- Add logic to try `loadProjectFromStorage` first
- Fall back to empty default project when storage returns `null`
- Handle storage errors gracefully with empty default fallback

### Step 4: Update Consumer Code
- Modify `src/editor.ts`
- Remove project selection logic (`kebabCaseToCamelCase`, `projectRegistry` lookup)
- Ensure `loadProjectFromStorage` callback returns `null` when no project is stored
- Remove `project` argument from `initEditor` call

### Step 5: Extract Default Project Constant
- Create `EMPTY_DEFAULT_PROJECT` constant in types
- Use this constant in the fallback logic
- Ensure consistent empty project structure

## Success Criteria

- [ ] `initEditor` function no longer requires `project` parameter
- [ ] Editor automatically loads from storage first
- [ ] Editor falls back to empty default project when storage is empty
- [ ] Consumer code is simplified (no project selection logic needed)
- [ ] All existing functionality preserved
- [ ] Tests pass with new API

## Affected Components

- `packages/editor/src/index.ts` - Remove project parameter, add project loading logic
- `packages/editor/src/state/types.ts` - Make loadProjectFromStorage required
- `src/editor.ts` - Remove project selection logic, update initEditor call
- Any tests that call `initEditor` directly

## Risks & Considerations

- **Breaking Change**: This is a breaking change to the public API
- **Migration**: Existing consumers will need to update their code
- **Storage Dependency**: Editor now requires `loadProjectFromStorage` to be implemented
- **Default Project**: Need to ensure empty default project has all required fields

## Related Items

- **Related**: TODO-021 (Refactor modules/projects to async callbacks) - This builds on the callback pattern established there
- **Related**: TODO-023 (Outsource compiler from editor) - Similar refactoring pattern

## References

- Current `initEditor` function signature in `packages/editor/src/index.ts`
- `Options` interface in `packages/editor/src/state/types.ts`
- Consumer usage in `src/editor.ts`

## Notes

- This refactoring makes the editor more self-contained and follows the established callback pattern
- The empty default project should match the structure currently used in the loader effect
- Consider adding a feature flag to make this change opt-in initially if needed

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 