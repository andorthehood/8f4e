---
title: 'TODO: Refactor Directive Parsing into Shared Parser'
priority: Medium
effort: 1-2d
created: 2026-02-26
status: Open
completed: null
---

# TODO: Refactor Directive Parsing into Shared Parser

## Problem Description

Directive parsing is currently duplicated across multiple editor-state features (`@color`, binary assets, code-block decorators, etc.), each with slightly different regexes and argument handling.

Current issues:
- Duplicate parsing logic increases maintenance cost and inconsistency risk.
- Feature-level parsers mix low-level tokenization with feature-specific validation.
- Adding new directive families (for runtime migration) will repeat the same parsing work.

## Proposed Solution

Use a state-level directive cache, maintained by a dedicated effect:

- Add a `directives` field to editor-state.
- Add a `directives` effect that subscribes to code-block code changes, reparses directives, and only updates state when the parsed directives actually changed.
- Keep parsing logic in a shared parser utility used by the effect.

The shared parser emits a normalized directive list:

```ts
type ParsedDirective = {
	name: string;
	args: string[];
	codeBlockId: string;
	codeBlockCreationId: number;
	lineNumber: number;
	sourceOrder: number;
	rawLine: string;
	argText: string | null;
};
```

Rules:
- Parser is string-first (no numeric coercion in the shared layer).
- Parses only canonical directive comments (`; @name ...`).
- Preserves deterministic ordering via `sourceOrder`.
- Feature handlers subscribe to `state.directives` and are responsible for type conversion and validation.
- Keep directive type definitions in a dedicated directives types module to avoid type-barrel/feature cycles.

## Anti-Patterns (Optional)

- Do not coerce argument values (`'1'`, `'01'`, `'1e3'`) in the shared parser.
- Do not bake feature-specific behavior (e.g., `@color` validation) into the generic parser.
- Do not change directive semantics while refactoring parse infrastructure.

## Implementation Plan

### Step 1: Add shared parser utility and directive types
- Create shared parser function(s) under `editor-state` directives feature.
- Add dedicated `features/directives/types.ts` for `ParsedDirective`.
- Return normalized `ParsedDirective[]` with source metadata.

### Step 2: Add directives cache effect and state field
- Add `state.directives` to editor-state types/defaults/testing utilities.
- Add `features/directives/effect.ts`.
- Effect subscribes to code edits, reparses directives, and only writes state when changed.

### Step 3: Migrate existing directive consumers incrementally
- Start with `color-directives` and binary asset directive parsing.
- Subscribe these features to `state.directives` updates.
- Keep behavior identical (last-write-wins, skip invalid directives, same warnings).

### Step 4: Expand adoption to remaining directive readers
- Update additional directive readers (e.g., plot/scan/slider parsers) to consume `state.directives` where practical.
- Remove redundant regex helpers once migrated.

### Step 5: Prepare runtime settings directive migration
- Reuse shared parser for runtime directive handlers.
- Keep runtime-specific argument validation in runtime-owned handlers.

## Validation Checkpoints (Optional)

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "^\\s*;\\s*@(\\w+)" packages/editor/packages/editor-state/src/features`
- `rg -n "commentMatch|;\\s*@\\(\\w+\\)" packages/editor/packages/editor-state/src/features`

## Success Criteria

- [x] Shared parser produces normalized directive records with source metadata.
- [x] `@color` and binary asset parsing use shared directive data without behavior regressions.
- [x] State-level directive cache (`state.directives`) is maintained by a dedicated effect with change detection.
- [ ] Duplicate directive-tokenization regex logic is reduced across all editor-state features.
- [ ] Shared parser/cache is fully adopted for runtime directive migration.

## Affected Components

- `packages/editor/packages/editor-state/src/features/directives` - shared directive parser, types, and directives cache effect
- `packages/editor/packages/editor-state/src/types.ts` - `State.directives` and directive type re-export
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - directives default value
- `packages/editor/packages/editor-state/src/pureHelpers/testingUtils/testUtils.ts` - directives in mock state defaults
- `packages/editor/packages/editor-state/src/features/color-directives` - migrated to directive cache consumption
- `packages/editor/packages/editor-state/src/features/binary-assets` - migrated to directive cache consumption
- `packages/editor/docs/editor-directives.md` - optional parser/reference notes if needed

## Risks & Considerations

- **Behavior drift risk**: Subtle regex/whitespace differences can break existing directives; preserve current behavior with regression tests.
- **Partial migration complexity**: Mixed old/new parser paths still exist for some features; keep migration incremental and well-scoped.
- **State churn risk**: Recomputing directives on every edit can cause noisy updates unless deep-equality guard is preserved.
- **Dependencies**: Coordinate with runtime-settings-to-directives migration to avoid conflicting parser changes.

## Related Items

- **Related**: [286-migrate-binary-assets-from-config-to-editor-directives.md](./286-migrate-binary-assets-from-config-to-editor-directives.md)
- **Related**: [287-migrate-color-scheme-from-config-to-color-directives.md](./287-migrate-color-scheme-from-config-to-color-directives.md)

## References

- `packages/editor/packages/editor-state/src/features/directives/types.ts`
- `packages/editor/packages/editor-state/src/features/directives/parseDirectives.ts`
- `packages/editor/packages/editor-state/src/features/directives/effect.ts`
- `packages/editor/packages/editor-state/src/features/color-directives/effect.ts`
- `packages/editor/packages/editor-state/src/features/binary-assets/parseBinaryAssetDirectives.ts`
- `packages/editor/packages/editor-state/src/types.ts`

## Notes

- This TODO is an infrastructure refactor and should preserve user-visible behavior.
- Implemented shape uses a state cache (`state.directives`) instead of each feature reparsing code blocks directly.
- Keep parser output stable and deterministic to support last-write-wins semantics.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
