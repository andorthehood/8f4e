---
title: 'TODO: Enable Strict TypeScript in Editor Package'
priority: Medium
effort: 2-3 days
created: 2025-08-23
status: Completed
completed: null
---

# TODO: Enable Strict TypeScript in Editor Package

## Problem Description

The editor package currently has relaxed TypeScript settings to avoid 52 type errors when strict null checks and noImplicitAny are enabled. This creates several issues:

- **Missing null checks**: Potential runtime errors from undefined/null access
- **Implicit any types**: Loss of type safety in event handlers and dynamic code
- **Inconsistent type safety**: Core packages have strict typing, but editor doesn't
- **Developer experience**: IntelliSense and error detection is reduced

During pre-Vite housekeeping, we had to disable strict settings in `packages/editor/tsconfig.json`:
```json
{
  "noImplicitAny": false,
  "strictNullChecks": false
}
```

## Proposed Solution

Incrementally enable strict TypeScript settings by fixing type issues file by file:

1. **Fix event system types** - Create proper interfaces for the generic event system
2. **Add parameter types** - Fix all implicit `any` parameters in event handlers  
3. **Null safety** - Add proper null checks for object property access
4. **Type guards** - Implement runtime type validation where needed

## Implementation Plan

### Step 1: Event System Type Safety
- Create `EventMap` interface defining all event types
- Type event handlers with proper parameter interfaces
- Replace generic `any` parameters with specific types
- Expected outcome: `src/events/index.ts` passes strict checks

### Step 2: State Management Types
- Fix object property access in `src/state/effects/loader.ts`
- Add type guards for dynamic menu access in `src/state/effects/menu/contextMenu.ts`
- Type destructuring parameters in code block handlers
- Expected outcome: All state management files pass strict checks

### Step 3: Enable Strict Settings
- Remove relaxed settings from `packages/editor/tsconfig.json`
- Fix any remaining type issues that surface
- Verify no functionality regression through manual testing
- Expected outcome: Editor package uses same strict settings as core packages

## Success Criteria

- [ ] `packages/editor/tsconfig.json` can use `strictNullChecks: true`
- [ ] `packages/editor/tsconfig.json` can use `noImplicitAny: true`
- [ ] Zero TypeScript errors when running `npm run typecheck`
- [ ] All event handlers have explicit parameter types
- [ ] No unsafe property access patterns remain
- [ ] Editor functionality works identically to before changes

## Affected Components

- `packages/editor/src/events/` - Event system needs complete typing
- `packages/editor/src/state/effects/` - Event handlers need parameter types
- `packages/editor/src/state/helpers/editor.ts` - Array access needs bounds checking
- `packages/editor/tsconfig.json` - Remove relaxed settings

## Risks & Considerations

- **Development time**: 52 errors need individual attention
- **Regression risk**: Type changes might alter runtime behavior
- **Testing burden**: Manual testing required for UI interactions
- **Dependencies**: Should complete before major editor refactoring

## Related Items

- **Related**: `004-ts-ignore-to-ts-expect-error.md` - Will reduce after this work
- **Blocks**: Future editor architecture improvements

## References

- [TypeScript Strict Mode Documentation](https://www.typescriptlang.org/docs/handbook/strict.html)
- [Event Handler Typing Patterns](https://www.typescriptlang.org/docs/handbook/2/functions.html)

## Notes

- Work was deferred during Vite migration preparation to focus on essential infrastructure
- Core packages (compiler, glugglug, etc.) already have excellent type safety
- This improvement will significantly enhance developer experience and catch runtime errors
- Current @ts-ignore comment in `src/state/index.ts` line 69 documents the type mismatch issue 