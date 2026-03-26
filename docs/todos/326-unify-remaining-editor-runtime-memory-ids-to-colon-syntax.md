---
title: 'TODO: Unify remaining editor/runtime memory ids to `module:memory` syntax'
priority: Medium
effort: 4-8h
created: 2026-03-26
status: Open
completed: null
---

# TODO: Unify remaining editor/runtime memory ids to `module:memory` syntax

## Problem Description

The repository currently has a cross-module memory identifier syntax split.

Current state:
- compiler address-style intermodule references use colon syntax such as `&module:memory` and `module:memory&`
- several editor/runtime paths still use dotted memory ids such as `module.memory`
- scanner and other directive-side memory resolution still accept cross-module references through dot parsing
- global keyboard-memory directives generate dotted ids
- keyboard-memory runtime handling splits ids on `.`
- binary-asset memory targeting also treats dotted ids as the cross-module form

Why this is a problem:
- users see inconsistent syntax depending on which subsystem they are touching
- editor directives can diverge from compiler-facing memory reference conventions
- migration to newer pointer/address forms becomes harder if old dotted forms remain embedded in editor/runtime infrastructure

Important nuance:
- the compiler still intentionally uses dot syntax for metadata-style intermodule operators such as `$module.memory`, `%module.memory`, `^module.memory`, and `!module.memory`
- this TODO is primarily about updating editor/runtime memory-id plumbing to use colon syntax for cross-module memory references
- if metadata-style compiler operators should also change later, that should be handled as a separate deliberate language-design pass

## Proposed Solution

Standardize editor/runtime cross-module memory ids on `module:memory`.

High-level approach:
- update editor/runtime memory-id resolvers and producers to parse and emit `module:memory`
- update directive docs and tests to use the colon form consistently
- decide whether to support dotted ids as a temporary backward-compatibility alias during migration

Expected result:
- scanner-style references use `otherModule:buffer`
- runtime memory ids such as keyboard memory targets use `module:memory`
- binary-asset targeting uses `&module:memory` rather than dotted equivalents

## Anti-Patterns

- Do not change compiler metadata operators (`$module.memory`, `%module.memory`, `^module.memory`, `!module.memory`) as part of this TODO unless explicitly expanded in scope.
- Do not leave half-migrated editor paths where some producers emit `:` but consumers still only parse `.`.
- Do not silently break existing saved editor/runtime state without either a migration or a compatibility window.

## Implementation Plan

### Step 1: Identify editor/runtime memory-id producers and consumers
- Update [resolveMemoryIdentifier.ts](/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts)
- Update [keyboardMemoryEvents.ts](/Users/andorpolgar/git/8f4e/packages/editor/src/events/keyboardMemoryEvents.ts)
- Update [global-editor-directives/keyboardMemory/shared.ts](/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/global-editor-directives/keyboardMemory/shared.ts)
- Update [binary-assets/effect.ts](/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/binary-assets/effect.ts)

### Step 2: Decide migration behavior
- Either support both `module.memory` and `module:memory` temporarily, or migrate directly if existing persisted state does not require compatibility
- Keep the rules explicit and documented

### Step 3: Update docs and directive examples
- Update editor directive docs where cross-module memory ids are described or implied
- Update runtime docs that currently describe audio buffer ids as `module.memory`
- Update examples/tests that rely on dotted cross-module memory ids in editor/runtime code

### Step 4: Verify cross-module widget/runtime features
- Confirm scanners, plots, watches, keyboard-memory directives, and binary-asset targeting all resolve cross-module memory through the colon form
- Ensure local forms such as `&name`, `name&`, and `*name` still work correctly

## Validation Checkpoints

- `rg -n "module\\.memory|moduleId\\}\\.|indexOf\\('\\.'\\)|includes\\('\\.'\\)" packages/editor src docs`
- `rg -n "resolveMemoryIdentifier|keyCodeMemoryId|keyPressedMemoryId|memoryId" packages/editor src`
- `npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/editor`

## Success Criteria

- [ ] Editor/runtime cross-module memory ids use `module:memory` consistently.
- [ ] Scanner and related directive-side memory resolution accept the colon form.
- [ ] Keyboard memory directives and runtime handlers no longer rely on dotted memory ids.
- [ ] Binary asset memory targeting uses colon syntax for cross-module references.
- [ ] Docs and tests reflect the new syntax consistently.

## Affected Components

- `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts` - cross-module memory-id parsing
- `packages/editor/src/events/keyboardMemoryEvents.ts` - runtime memory-id parsing
- `packages/editor/packages/editor-state/src/features/global-editor-directives/keyboardMemory/shared.ts` - memory-id generation
- `packages/editor/packages/editor-state/src/features/binary-assets/effect.ts` - binary asset target normalization
- `packages/editor/packages/editor-state/src/features/runtime/types.ts` - runtime docs/comments
- `packages/editor/docs/` - directive/user-facing syntax docs

## Risks & Considerations

- **Backward compatibility**: persisted state or directives may still contain dotted ids.
- **Partial migration risk**: producer/consumer mismatch will cause silent resolution failures.
- **Language-boundary confusion**: this TODO should not accidentally blur the distinction between editor/runtime ids and compiler metadata operator syntax.

## Related Items

- **Related**: [309-extract-shared-module-memory-identifier-parser.md](/Users/andorpolgar/git/8f4e/docs/todos/309-extract-shared-module-memory-identifier-parser.md)
- **Related**: [319-add-pointee-element-word-size-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/319-add-pointee-element-word-size-prefix-for-pointers.md)
- **Related**: [320-add-pointee-start-address-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/320-add-pointee-start-address-prefix-for-pointers.md)

## Notes

- This TODO is specifically about editor/runtime cross-module memory-id syntax.
- If the compiler metadata operators should move from dot to colon later, that should be captured in a separate TODO so the language change is reviewed explicitly.
