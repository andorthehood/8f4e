# TODO: Remove @ts-ignore Comments Through Proper Typing

**Priority**: 🟢  
**Estimated Effort**: 1-2 days  
**Created**: 2025-08-23  
**Status**: Completed  

## Problem Description

The codebase currently has 21 `@ts-ignore` comments that suppress TypeScript errors without addressing the underlying type issues. This creates several problems:

- **Hidden type safety issues**: Real problems are masked instead of solved
- **Technical debt accumulation**: Type issues compound over time
- **Reduced IntelliSense**: IDE support is diminished in suppressed areas
- **Maintenance burden**: Future developers don't understand the actual types

Current locations with `@ts-ignore`:
- WebAssembly instantiation in multiple packages
- AudioWorklet constructor parameters
- Canvas API calls with incomplete browser types
- Interface mismatches in editor state management

## Proposed Solution

**Remove all `@ts-ignore` comments by implementing proper TypeScript solutions:**

1. **Add missing type definitions** for incomplete browser APIs
2. **Create proper interfaces** for WebAssembly and AudioWorklet contexts
3. **Fix type mismatches** through proper type design
4. **Use type assertions** only where absolutely necessary with proper context

**No conversions to `@ts-expect-error`** - aim for complete type safety.

## Implementation Plan

### Step 1: Categorize Current Suppressions
- **WebAssembly types**: `createModule.ts` files across packages
- **AudioWorklet types**: Constructor and processor method parameters
- **Browser API gaps**: Canvas `convertToBlob`, incomplete Web APIs
- **Interface mismatches**: Editor state type conflicts
- Expected outcome: Clear understanding of what needs proper typing

### Step 2: Add Missing Type Definitions
- Create proper WebAssembly instantiation types
- Define AudioWorkletProcessor constructor parameters correctly
- Add missing Canvas/OffscreenCanvas method types
- Expected outcome: Comprehensive type coverage for browser APIs

### Step 3: Fix Interface Design Issues
- Resolve editor state interface mismatches through proper type design
- Use union types or proper inheritance where needed
- Implement type guards for runtime validation
- Expected outcome: All interface conflicts resolved through design

### Step 4: Verify Complete Type Safety
- Remove all `@ts-ignore` comments
- Ensure TypeScript compilation passes with strict settings
- Verify no functionality regression
- Expected outcome: Zero type suppressions, full type safety

## Success Criteria

- [ ] Zero `@ts-ignore` comments remain in codebase
- [ ] Zero `@ts-expect-error` comments added as replacements
- [ ] All TypeScript compilation passes without suppressions
- [ ] IntelliSense works correctly in all previously suppressed areas
- [ ] No functionality regression in any component
- [ ] Proper type definitions exist for all browser APIs used

## Affected Components

**High-priority removals** (proper types exist or can be defined):
- `packages/runtime-audio-worklet/src/index.ts` - AudioWorklet constructor
- `packages/editor/src/state/index.ts` - Interface mismatch (design issue)
- Multiple `createModule.ts` files - WebAssembly instantiation

**Medium-priority removals** (may need custom type definitions):
- `packages/editor/packages/sprite-generator/visual-testing/index.ts` - Canvas `convertToBlob`
- Browser API gaps that can be properly typed

## Risks & Considerations

- **More effort required**: Proper typing takes longer than suppression
- **API research needed**: Some browser APIs may need deep investigation
- **Design changes**: Some suppressions indicate architectural issues
- **Type definition maintenance**: Custom types need to be maintained
- **Breaking changes**: Proper types might reveal actual bugs

## Related Items

- **Depends on**: `002-editor-package-type-safety.md` - Will resolve some suppressions
- **Higher value**: This provides actual type safety vs. just cleaner suppressions
- **Blocks**: Future TypeScript strict mode improvements

## References

- [TypeScript Handbook: Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [WebAssembly TypeScript Types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/webassembly-js-api)
- [AudioWorklet TypeScript Integration](https://github.com/microsoft/TypeScript/issues/28308)
- [Canvas API Type Definitions](https://github.com/microsoft/TypeScript/lib/lib.dom.d.ts)

## Notes

- **Better approach**: Fix the underlying type issues rather than suppress them
- **Long-term value**: Proper types provide ongoing benefits vs. suppression
- **Quality focus**: This improves actual code quality, not just linting scores
- **Educational**: Team learns proper TypeScript patterns instead of avoidance
- **Some suppressions may be legitimate**: If browser APIs truly have incomplete types, document why and consider contributing upstream 