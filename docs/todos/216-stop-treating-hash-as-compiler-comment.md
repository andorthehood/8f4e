---
title: 'TODO: Stop treating # as compiler comments'
priority: Medium
effort: 2-4h
created: 2026-02-09
status: Completed
completed: 2026-02-09
---

# TODO: Stop treating # as compiler comments

## Problem Description

The compiler currently treats `#` as a comment marker both at line start and as an inline trailing comment delimiter. This conflicts with the planned use of `#` for future compiler directives.

As long as `#` remains comment syntax, introducing hash-prefixed directives requires extra parsing exceptions and increases ambiguity.

## Proposed Solution

Remove hash comment handling from compiler syntax rules and keep semicolon as the canonical compiler comment marker.

Scope:
- `#` should no longer be recognized as comment by default.
- `;` remains valid for line and trailing comments.
- Any future `#...` handling should be explicit directive parsing, not generic comment parsing.

## Implementation Plan

### Step 1: Update compiler comment parsing rules
- Update `packages/compiler/src/syntax/isComment.ts` to match only semicolon-start comments.
- Update `packages/compiler/src/syntax/instructionParser.ts` so trailing inline comments are terminated by `;` only.

### Step 2: Update tests and snapshots
- Update compiler syntax tests that currently expect `#` behavior.
- Regenerate/update snapshots if parser output changes.

### Step 3: Validate repository impact
- Search for source/test files relying on `#` comments in compiler-facing code and migrate them where needed.
- Keep editor-level directive migration tracked separately in TODO 215.

## Validation Checkpoints

- `rg -n "^\\s*#" packages/compiler packages/examples src`
- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`

## Success Criteria

- [x] Compiler no longer treats `#` as line comments.
- [x] Compiler no longer treats trailing `# ...` as inline comments.
- [x] Compiler test suite passes with updated syntax expectations.
- [x] Remaining hash-prefixed syntax is reserved for explicit future directive handling.

## Affected Components

- `packages/compiler/src/syntax/isComment.ts` - remove hash comment detection.
- `packages/compiler/src/syntax/instructionParser.ts` - remove trailing hash comment support.
- `packages/compiler/src/syntax/**` tests - update expectations.
- `packages/compiler/tests/**` - update any fixtures/snapshots relying on hash comments.

## Risks & Considerations

- **Breaking syntax change**: existing programs using `#` comments will fail until migrated.
- **Migration ordering**: should land after or together with TODO 215 directive migration.
- **Future directive design**: keep hash parsing strict and explicit when compiler directives are introduced.

## Related Items

- **Depends on / Related**: `docs/todos/215-migrate-editor-directives-to-semicolon-comments.md`
- **Related**: `docs/todos/archived/192-hash-prefixed-editor-directives.md`

## Notes

- Pre-release status allows this breaking syntax cleanup without compatibility fallback.
