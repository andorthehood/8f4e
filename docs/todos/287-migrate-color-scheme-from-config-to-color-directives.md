---
title: 'TODO: Migrate Color Scheme from Config to Color Directives'
priority: Medium
effort: 1-2d
created: 2026-02-26
status: Open
completed: null
---

# TODO: Migrate Color Scheme from Config to Color Directives

## Problem Description

Color customization is currently configured through project config (`compiledProjectConfig.colorScheme`).
The desired model is editor-directive-driven styling, aligned with other editor metadata conventions.

Current issues:
- Color configuration is separated from source blocks and editor directives.
- Project config shape still carries UI styling concerns.
- `icons.feedbackScale` is array-based, which complicates directive-based scalar assignment.

## Proposed Solution

Move color configuration from project config to editor directives using:

- `; @color <path> <value>`
  - Example: `; @color text.code #cccccc`
  - Example: `; @color fill.moduleBackground rgba(0,0,0,0.9)`

Rules:
- Allowed in any block type.
- Parsed across all code blocks in file order.
- Last-write-wins when the same path is defined multiple times.
- Invalid paths/values should log warnings and be skipped.

Schema changes:
- Remove `colorScheme` from project config schema/types/defaults.
- Remove array usage for feedback scale by refactoring:
  - `icons.feedbackScale` (array)
  - into scalar fields (e.g. `icons.feedbackScale0`, `icons.feedbackScale1`, etc.)

## Anti-Patterns (Optional)

- Do not keep project config color scheme as an active source of truth.
- Do not keep array-based feedback scale in the final schema.
- Do not hard-fail the editor on invalid `@color` directives.

## Implementation Plan

### Step 1: Add color directive parser and application effect
- Parse `; @color <path> <value>` directives from all code blocks.
- Apply valid overrides to the runtime color scheme with last-write-wins behavior.
- Log warnings for unknown paths or invalid values.

### Step 2: Refactor feedback scale to scalar fields
- Replace `icons.feedbackScale` array with individual scalar fields.
- Update sprite generator/editor usages and typings accordingly.

### Step 3: Remove project config color scheme shape
- Remove `colorScheme` from project config defaults, schema, and types.
- Update effects/tests that currently read or write config color scheme.

### Step 4: Documentation and migration updates
- Document `@color` in editor directives docs.
- Update examples/projects to use directives for color customization.

## Validation Checkpoints (Optional)

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `npx nx run editor:test`
- `npx nx run-many --target=test --all`
- `rg -n "colorScheme|feedbackScale" packages/editor packages/examples`

## Success Criteria

- [ ] Color scheme customization is fully directive-driven via `; @color`.
- [ ] Project config no longer contains `colorScheme`.
- [ ] Feedback scale no longer uses arrays.
- [ ] Duplicate `@color` paths resolve via last-write-wins.
- [ ] Invalid directives are warned and skipped without crashes.
- [ ] Existing examples continue to render correctly after migration.

## Affected Components

- `packages/editor/packages/editor-state/src/features/project-config` - remove color scheme config shape
- `packages/editor/packages/editor-state` color application effects/types - apply directive overrides
- `packages/editor/packages/sprite-generator` - feedback scale scalar field refactor
- `packages/editor/docs/editor-directives.md` - document `@color`
- `packages/examples/src/projects/*.8f4e` - migrate color customization

## Risks & Considerations

- **Path validation complexity**: dot-path mapping must stay type-safe and predictable.
- **Behavior drift**: color defaults must remain stable when no directives are provided.
- **Refactor breadth**: feedback scale shape change may affect multiple renderer and asset-generation paths.
- **Breaking changes**: API break is acceptable pre-release but requires full example/test migration.

## Related Items

- **Related**: [286-migrate-binary-assets-from-config-to-editor-directives.md](./286-migrate-binary-assets-from-config-to-editor-directives.md)
- **Related**: [204-expose-sprite-generator-color-helpers.md](./204-expose-sprite-generator-color-helpers.md)

## References

- `packages/editor/packages/editor-state/src/features/project-config/schema.ts`
- `packages/editor/packages/editor-state/src/features/project-config/types.ts`
- `packages/editor/packages/editor-state/src/features/project-config/defaults.ts`
- `packages/editor/docs/editor-directives.md`

## Notes

- There are no built-in themes anymore; only explicit `@color` overrides are needed.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
