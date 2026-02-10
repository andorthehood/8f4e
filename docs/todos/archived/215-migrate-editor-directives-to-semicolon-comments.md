---
title: 'TODO: Migrate editor directives to semicolon comments and reserve # for compiler directives'
priority: Medium
effort: 4-6h
created: 2026-02-09
status: Open
completed: null
---

# TODO: Migrate editor directives to semicolon comments and reserve # for compiler directives

## Problem Description

Editor-only instructions currently use hash-prefixed lines (for example `# debug`, `# button`, `# switch`), while hash is also intended as a future compiler-directive prefix. This creates ambiguity between editor-only metadata and planned compiler-level semantics.

Because the project is pre-release, we can make a direct syntax migration without backward-compatibility layers.

## Proposed Solution

Move editor-only instructions to semicolon comment lines with an explicit editor marker:
- New editor directive format: `; @<instruction> ...`
- Examples: `; @debug ...`, `; @button ...`, `; @switch ...`, `; @plot ...`, `; @offset ...`

Treat these lines as compiler comments (already ignored by compiler), and update editor directive parsers to recognize `; @...` directives.

Defer hash-based compiler directives to a follow-up compiler feature. For now, this TODO only changes editor directive syntax and usage.

## Implementation Plan

### Step 1: Update editor directive parsing
- Update editor code-parser utilities that currently read hash-prefixed directives to parse semicolon-prefixed `@` directives from comment text.
- Keep parsing strict enough to avoid interpreting normal comments as directives (`; note` should remain a plain comment, `; @note` can be directive-like only when recognized by a feature parser).

### Step 2: Migrate examples and fixtures
- Update all examples using hash-prefixed editor directives in `packages/examples`.
- Update any test fixtures and snapshots that still use hash-prefixed editor directives.

### Step 3: Update docs and references
- Document `; @instruction` as the editor directive convention.
- Mark plain hash-prefixed editor directives as deprecated/removed.
- Note that `#` is being reserved for future compiler directives.

## Validation Checkpoints

- `rg -n "^\\s*#" packages/examples/src`
- `rg -n ";\\s*@\\w+" packages/examples/src`
- `npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/examples`

## Success Criteria

- [ ] Editor directives are parsed from `; @instruction` lines.
- [ ] Hash-prefixed editor directives are removed from examples and test fixtures.
- [ ] Compiler behavior remains unchanged (directive lines still treated as comments).
- [ ] Documentation reflects the new editor directive format and `#` reservation plan.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/codeParser.ts` - directive parsing updates.
- `packages/editor/packages/editor-state/src/features/code-editing/**` - highlighting/parsing expectations if needed.
- `packages/examples/src/modules/**` - migrate editor directive usage.
- `packages/examples/src/projects/**` - migrate editor directive usage.
- `docs/**` - update language/editor directive documentation.

## Risks & Considerations

- **Migration misses**: leftover `#` editor directives may silently stop working depending on parser behavior.
- **Comment ambiguity**: parser must only treat explicit `; @...` lines as directives.
- **Future compiler directives**: this TODO should not implement hash compiler directives yet; only reserve the syntax direction.

## Related Items

- **Related**: `docs/todos/archived/192-hash-prefixed-editor-directives.md`

## Notes

- No compatibility bridge is required for pre-release status.
- This change intentionally clarifies ownership: `; @...` is editor metadata, future `#...` is compiler territory.
