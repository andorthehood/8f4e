---
title: 'TODO: Refactor ArgumentIdentifier to a discriminated union'
priority: Medium
effort: 2-4 hours
created: 2026-04-02
status: Completed
completed: 2026-04-15
---

# TODO: Refactor ArgumentIdentifier to a discriminated union

## Problem Description

`ArgumentIdentifier` in `packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts` is a flat type with all fields optional and `referenceKind` acting as an informal discriminant. This means TypeScript cannot enforce which fields are actually present for a given kind, so `resolveCompileTimeArgument.ts` has to use non-null assertions (`!`) when accessing `targetModuleId`, `targetMemoryId`, `targetMemoryIndex`, etc.

## Proposed Solution

Replace the flat `ArgumentIdentifier` type with a proper TypeScript discriminated union, one member per `ReferenceKind`. Each member would declare only the fields that are actually meaningful for that kind, all as required (non-optional) properties.

Example shape:

```ts
type ArgumentIdentifier =
  | { type: ArgumentType.IDENTIFIER; referenceKind: 'plain'; scope: 'local'; value: string }
  | { type: ArgumentType.IDENTIFIER; referenceKind: 'memory-reference'; scope: 'local'; value: string; targetMemoryId: string; isEndAddress: boolean }
  | { type: ArgumentType.IDENTIFIER; referenceKind: 'intermodular-module-reference'; scope: 'intermodule'; value: string; targetModuleId: string; isEndAddress: boolean }
  | { type: ArgumentType.IDENTIFIER; referenceKind: 'intermodular-module-nth-reference'; scope: 'intermodule'; value: string; targetModuleId: string; targetMemoryIndex: number }
  | { type: ArgumentType.IDENTIFIER; referenceKind: 'intermodular-reference'; scope: 'intermodule'; value: string; targetModuleId: string; targetMemoryId: string; isEndAddress: boolean }
  // ... one member per ReferenceKind
```

After narrowing on `referenceKind`, all field accesses in `resolveCompileTimeArgument.ts` and anywhere else become type-safe without `!`.

## Implementation Plan

### Step 1: Define the discriminated union
- One member per `ReferenceKind` value in `parseArgument.ts`.
- Keep `type: ArgumentType.IDENTIFIER` on every member.
- Make all per-kind fields required.

### Step 2: Update call sites
- `classifyIdentifier` return types will be inferred correctly once the union is in place.
- Remove all `!` assertions from `resolveCompileTimeArgument.ts`.
- Fix any other files that access `ArgumentIdentifier` fields directly.

### Step 3: Remove `ReferenceKind` if it becomes redundant
- If the union makes the standalone `ReferenceKind` type unnecessary, remove it.

## Success Criteria

- [ ] `ArgumentIdentifier` is a discriminated union.
- [ ] No `!` non-null assertions remain on `ArgumentIdentifier` field accesses.
- [ ] TypeScript typechecks clean with no new suppressions.
- [ ] All existing tests pass.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts`
- `packages/compiler/src/semantic/resolveCompileTimeArgument.ts`
- Any other file that constructs or reads `ArgumentIdentifier`.

## Risks & Considerations

- Mechanical but wide-touching refactor — worth doing in one focused PR to avoid merge conflicts.

## Related Items

- Related: `docs/todos/archived/363-enforce-classifyidentifier-check-ordering.md`

## Notes

- Non-null assertions were introduced incrementally as new `ReferenceKind` variants were added (most recently `intermodular-module-nth-reference`). This refactor should be done before the next new variant is added.
