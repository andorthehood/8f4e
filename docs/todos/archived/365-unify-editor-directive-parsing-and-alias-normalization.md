---
title: 'TODO: Unify editor directive parsing and alias normalization'
priority: Low
effort: 2-4 hours
created: 2026-04-03
status: Completed
completed: 2026-04-15
---

# TODO: Unify editor directive parsing and alias normalization

## Problem Description

Editor directive parsing is currently split across multiple overlapping paths:

- `parseDirectiveComment(...)`
- `parseEditorDirectives(...)`
- `parseBlockDirectives(...)`
- alias normalization inside directive-state derivation

These paths do similar work but do not share a single source of truth for:

1. full-line editor directive parsing
2. trailing inline directive parsing
3. alias normalization such as `@w -> @watch`

That duplication already caused drift while extending `@watch`:

- inline `@watch` initially worked in one parsing path but not in cached block-directive resolution
- shorthand alias support required fixes in more than one place

As more directives gain shorthands or inline behavior, this duplication will keep increasing maintenance cost and make behavioral drift more likely.

## Proposed Solution

Extract one low-level shared directive parsing/normalization helper and make the current higher-level flows build on it.

The shared helper should:

- parse directive-shaped comments from a raw source line
- support full-line and trailing inline editor directives where allowed
- normalize plugin aliases to canonical directive names

The existing higher-level functions can remain, but they should delegate to the shared helper instead of re-implementing the logic.

## Implementation Plan

### Step 1: Extract a shared parser primitive
- Add a small pure helper under the editor directive feature area.
- Make it accept a source line plus plugin metadata.
- Return a normalized directive record with canonical name and raw args.

### Step 2: Reuse it in both current flows
- Update `parseEditorDirectives(...)` to use the shared parser primitive.
- Update `parseBlockDirectives(...)` to use the same primitive or a thin wrapper around it.
- Remove duplicate alias-resolution logic from `deriveDirectiveState(...)`.

### Step 3: Lock behavior with focused tests
- Add tests that cover:
  - full-line directive parsing
  - trailing inline parsing
  - alias normalization
  - parity between direct parsing and cached block-directive resolution

## Success Criteria

- [ ] Editor directive parsing rules live in one shared implementation.
- [ ] Alias normalization happens in one place only.
- [ ] Full-line and inline directive behavior stay consistent across editor-state flows.
- [ ] Existing editor-state tests remain green.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/utils.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/registry.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/parseBlockDirectives.ts`

## Risks & Considerations

- Keep the shared helper narrow. The goal is to remove duplicated parsing rules, not to introduce a large directive framework.
- Runtime directives (`; ~...`) and editor directives (`; @...`) may still need separate higher-level entry points even if they share the same low-level parsing primitive.

## Related Items

- Related: `364-centralize-alwaysontop-code-block-partition-logic.md`

## Notes

- This is a maintainability refactor. It is worth doing before adding more directive aliases or more inline directive behavior.
