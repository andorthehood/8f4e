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

Introduce a shared directive parser in `@8f4e/editor-state` that scans code blocks and emits a normalized directive list:

```ts
type ParsedDirective = {
	name: string;
	args: string[];
	codeBlockCreationId: number;
	lineNumber: number;
	sourceOrder: number;
	rawLine: string;
};
```

Rules:
- Parser is string-first (no numeric coercion in the shared layer).
- Parses only canonical directive comments (`; @name ...`).
- Preserves deterministic ordering via `sourceOrder`.
- Feature handlers are responsible for type conversion and validation.

## Anti-Patterns (Optional)

- Do not coerce argument values (`'1'`, `'01'`, `'1e3'`) in the shared parser.
- Do not bake feature-specific behavior (e.g., `@color` validation) into the generic parser.
- Do not change directive semantics while refactoring parse infrastructure.

## Implementation Plan

### Step 1: Add shared parser utility and types
- Create shared parser function(s) under `editor-state` feature utils.
- Return normalized `ParsedDirective[]` with source metadata.

### Step 2: Migrate existing directive consumers incrementally
- Start with `color-directives` and binary asset directive parsing.
- Keep behavior identical (last-write-wins, skip invalid directives, same warnings).

### Step 3: Expand adoption to remaining directive readers
- Update additional directive readers (e.g., plot/scan/slider parsers) to consume shared parser output where practical.
- Remove redundant regex helpers once migrated.

### Step 4: Prepare runtime settings directive migration
- Reuse shared parser for runtime directive handlers.
- Keep runtime-specific argument validation in runtime-owned handlers.

## Validation Checkpoints (Optional)

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "^\\s*;\\s*@(\\w+)" packages/editor/packages/editor-state/src/features`
- `rg -n "commentMatch|;\\s*@\\(\\w+\\)" packages/editor/packages/editor-state/src/features`

## Success Criteria

- [ ] Shared parser produces normalized directive records with source metadata.
- [ ] `@color` and binary asset parsing use the shared parser without behavior regressions.
- [ ] Duplicate directive-tokenization regex logic is reduced across editor-state features.
- [ ] Shared parser is documented and reusable for runtime directive migration.

## Affected Components

- `packages/editor/packages/editor-state/src/features` - shared directive parser utility and migrated consumers
- `packages/editor/packages/editor-state/src/features/color-directives` - parser migration
- `packages/editor/packages/editor-state/src/features/binary-assets` - parser migration
- `packages/editor/docs/editor-directives.md` - optional parser/reference notes if needed

## Risks & Considerations

- **Behavior drift risk**: Subtle regex/whitespace differences can break existing directives; preserve current behavior with regression tests.
- **Partial migration complexity**: Mixed old/new parser paths may exist temporarily; keep migration incremental and well-scoped.
- **Dependencies**: Coordinate with runtime-settings-to-directives migration to avoid conflicting parser changes.

## Related Items

- **Related**: [286-migrate-binary-assets-from-config-to-editor-directives.md](./286-migrate-binary-assets-from-config-to-editor-directives.md)
- **Related**: [287-migrate-color-scheme-from-config-to-color-directives.md](./287-migrate-color-scheme-from-config-to-color-directives.md)

## References

- `packages/editor/packages/editor-state/src/features/color-directives/effect.ts`
- `packages/editor/packages/editor-state/src/features/binary-assets/parseBinaryAssetDirectives.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/gaps.ts`

## Notes

- This TODO is an infrastructure refactor and should preserve user-visible behavior.
- Keep parser output stable and deterministic to support last-write-wins semantics.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
