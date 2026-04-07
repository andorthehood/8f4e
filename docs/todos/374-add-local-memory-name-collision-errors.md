---
title: 'TODO: Add local-vs-memory name collision errors'
priority: Medium
effort: 1-3h
created: 2026-04-07
status: Open
completed: null
---

# TODO: Add local-vs-memory name collision errors

## Problem Description

The `local` instruction currently adds names into `CompilationContext.locals` without checking whether the same identifier is already used by a memory declaration in the current namespace.

That allows ambiguous programs where a local declaration can silently reuse a memory identifier. The ambiguity then leaks into later compiler stages such as `push` identifier resolution, where plain identifiers may need to distinguish between memory and locals.

This should fail at the local declaration site with a clear compiler error instead of leaving name conflicts to later semantic behavior.

## Proposed Solution

Add collision detection to local declaration handling so `local <type> <name>` throws when `<name>` is already taken by a memory declaration in the same namespace.

Desired behavior:
- reject local declarations that collide with existing memory identifiers
- surface a dedicated, clear compiler error for the collision
- keep the failure at declaration time instead of relying on downstream ambiguity checks

## Anti-Patterns

- Do not resolve collisions by silently shadowing memory with locals.
- Do not add fallback resolution rules that try to “guess” whether the user meant memory or local.
- Do not defer the error until `push`, `localGet`, `localSet`, or other later instructions use the colliding name.

## Implementation Plan

### Step 1: Add an explicit compiler error
- Introduce a dedicated compiler error code/message for local declarations that collide with memory identifiers.
- Keep the message specific enough to explain which identifier is already taken.

### Step 2: Validate in local declaration handling
- Update `local` instruction compilation/semantic handling to reject names already present in `context.namespace.memory`.
- Keep existing valid local declarations unchanged.

### Step 3: Add regression tests
- Add tests showing that a colliding local declaration throws at the declaration line.
- Add coverage for a non-colliding declaration to prove normal behavior still works.

### Step 4: Document the rule
- Note in local/declaration docs that local names must not collide with memory identifiers in the same namespace.

## Validation Checkpoints

- `npx nx run compiler:test`
- `rg -n "local instruction|DUPLICATE|collision|namespace\\.memory" packages/compiler/src`
- `rg -n "\\blocal\\b" packages/compiler/docs/instructions/declarations-and-locals.md`

## Success Criteria

- [ ] Declaring a local with the same name as a memory item fails immediately.
- [ ] The compiler reports a dedicated, clear error for the collision.
- [ ] Non-colliding local declarations still compile normally.
- [ ] Tests cover both the error and the normal path.

## Affected Components

- `packages/compiler/src/instructionCompilers/local.ts`
- `packages/compiler/src/compilerError.ts`
- `packages/compiler/tests`
- `packages/compiler/docs/instructions/declarations-and-locals.md`

## Risks & Considerations

- **Intentional breakage**: Existing unreleased source that relied on ambiguous local/memory reuse will stop compiling.
- **Error-shape choice**: Reusing a generic duplicate-name error may be simpler, but a dedicated collision error will be clearer.
- **Future consistency**: If this rule is adopted for locals, related declaration paths may also need similar collision policies.

## Related Items

- **Related**: `docs/todos/372-make-push-local-equivalent-to-localget.md`
- **Related**: `docs/todos/373-remove-localget-and-migrate-sources-to-push.md`
- **Related**: `docs/todos/369-reduce-duplicate-memory-declaration-rule-encoding-between-tokenizer-and-compiler.md`

## Notes

- Breaking APIs are acceptable here; the compiler has not been released yet, so failing early is preferable to preserving ambiguous name resolution.
