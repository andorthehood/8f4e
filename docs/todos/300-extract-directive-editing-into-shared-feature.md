---
title: 'TODO: Extract directive editing into shared feature'
priority: Medium
effort: 4-8h
created: 2026-03-13
status: Open
completed: null
---

# TODO: Extract directive editing into shared feature

## Problem Description

The editor now has a clearer separation for directive parsing and meaning under `features/directives/`, but directive source editing is still split across multiple places.

Current examples include:

- `directives/pos/upsert.ts`
- `directives/disabled/upsert.ts`
- `utils/removeDirective.ts`
- group-specific directive rewriting in the group feature area
- watch directive removal in `clearDebugProbes`

These operations all belong to the same class of concern:

- inserting directives
- removing directives
- replacing directive arguments
- canonicalizing directive placement and formatting

That concern is different from directive semantics.
A directive should define what it means, not necessarily own the mechanics of rewriting source text.

## Proposed Solution

Create a shared directive-editing area, for example:

- `features/code-blocks/features/directiveEditing/`

This feature should own reusable source-editing mechanics for editor directives, such as:

- remove directive lines by name
- upsert a canonical single-line directive
- replace directive arguments while preserving placement rules
- query directive lines for editing operations

Directive folders should stay focused on:

- directive parsing
- argument interpretation
- derived block metadata / widgets / layout

User-facing command/effect features should remain separate.
For example:

- `clearDebugProbes` should stay its own action feature
- but its code-manipulation logic should use shared directive-editing helpers

The same applies to group actions:

- keep `ungroup`, `remove group`, and `nonstick` toggles as separate features
- move their string-editing mechanics onto shared directive-editing primitives

## Anti-Patterns

- Do not move all directive-related actions into one monolithic `directiveEditing` feature.
- Do not keep directive-specific upsert/remove helpers scattered across directive folders and feature folders.
- Do not mix directive semantics with source-editing mechanics in the same helper by default.
- Do not rewrite action/effect wiring when only the editing primitive needs to move.

## Implementation Plan

### Step 1: Create shared directive-editing primitives
- Add a shared feature or utility area for directive source manipulation.
- Start with focused primitives such as:
  - remove directives by name
  - upsert a canonical single-line directive
  - replace directive line content while preserving placement

### Step 2: Migrate current directive editing helpers
- Move `@pos` and `@disabled` upsert logic onto the shared editing layer.
- Reuse the shared directive parser where appropriate for directive-line detection.

### Step 3: Rewire directive-driven action features
- Update group-related actions to use the shared directive-editing helpers.
- Update `clearDebugProbes` to remain its own feature but delegate source edits to the shared editing layer.

### Step 4: Document the boundary
- Update contributor docs to explain the separation between:
  - directive semantics
  - directive editing/manipulation

## Validation Checkpoints

- `npx nx run @8f4e/editor-state:test -- --runInBand`
- `npx nx run @8f4e/editor-state:typecheck`
- `rg -n "upsert|removeDirective|replaceGroupName|clearDebugProbes" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Directive source-editing primitives live in one shared area.
- [ ] `@pos` and `@disabled` no longer own standalone upsert helpers inside directive folders.
- [ ] Group-related directive rewrites use shared editing primitives.
- [ ] `clearDebugProbes` remains a separate action feature but no longer owns directive-removal mechanics.
- [ ] Contributor docs clearly distinguish directive semantics from directive editing.
- [ ] Editor-state tests still pass after the refactor.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/group/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/clearDebugProbes/`
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/removeDirective.ts`
- `packages/editor/docs/contributing-editor-directives.md`

## Risks & Considerations

- **Over-centralization**: the shared feature should own editing mechanics, not absorb every directive-related action.
- **Behavior drift**: canonical placement rules for directives such as `@pos` and `@disabled` must remain unchanged.
- **Abstraction quality**: the shared helpers should be specific enough to be useful without becoming a vague “directive utils” dumping ground.

## Related Items

- **Related**: `docs/todos/298-move-group-directive-under-central-directive-system.md`
- **Related**: `docs/todos/299-move-favorite-directive-under-central-directive-system.md`

## Notes

- This TODO is specifically about source editing/manipulation, not directive semantics.
- The preferred architecture is:
  - directive folders define meaning
  - a shared editing layer rewrites code
  - separate action/effect features express user intent and call the shared editing layer
