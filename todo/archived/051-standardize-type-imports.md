# TODO: Standardize Type Imports with `import type` and `import { type }`

**Priority**: 🟢  
**Estimated Effort**: 2-3 hours  
**Created**: 2025-09-02  
**Status**: Open
**Completed**: 2025-09-05

## Problem Description

The codebase has inconsistent type import patterns that impact bundle optimization and code clarity:

**Current inconsistent patterns:**
- Some files use `import type { TypeName }` (good practice)
- Other files use `import { TypeName }` for types (suboptimal)
- Mixed imports don't consistently use inline `type` modifiers
- This creates larger bundles and unclear intent about what's imported

**Impact:**
- **Bundle size**: Type-only imports are not properly eliminated during compilation
- **Code clarity**: Unclear whether imports are for types or runtime values
- **Tree shaking**: Bundlers can't optimize as effectively
- **Maintenance**: Inconsistent patterns make code harder to understand

**Current problematic examples:**
```typescript
// ❌ Suboptimal - importing types without 'type' keyword
import { ExampleModule } from '../../../packages/editor/src/state/types';
import { Project } from '../../../packages/editor/src/state/types';

// ✅ Good - already used in some places
import type { Project, EditorSettings } from '@8f4e/editor';
import type { Instruction } from '@8f4e/compiler';
```

## Proposed Solution

**Standardize all type imports to use modern TypeScript patterns:**

1. **Pure type imports**: Use `import type { TypeName }` syntax
2. **Mixed imports**: Use inline `type` modifiers: `import { type TypeName, runtimeValue }`
3. **Consistent patterns**: Apply the same approach across all packages
4. **Bundle optimization**: Ensure all type-only imports are properly eliminated

**Key changes required:**
- Update all pure type imports to use `import type`
- Update mixed imports to use inline `type` modifiers
- Maintain existing runtime imports unchanged
- Ensure consistency across all packages

## Implementation Plan

### Step 1: Audit Current Type Import Patterns
- Scan all TypeScript files for type imports
- Categorize imports as: pure types, mixed imports, or runtime-only
- Create inventory of files needing updates
- Expected outcome: Complete understanding of current state

### Step 2: Update Pure Type Imports
- Convert `import { TypeName }` to `import type { TypeName }` for type-only imports
- Focus on files in `src/examples/modules/` and `src/examples/projects/`
- Update cross-package type imports (editor ↔ compiler)
- Expected outcome: All pure type imports use `import type` syntax

### Step 3: Update Mixed Imports
- Convert mixed imports to use inline `type` modifiers
- Example: `import { type Module, compileProject } from '@8f4e/compiler'`
- Ensure runtime values remain as regular imports
- Expected outcome: Clear separation of types and runtime values in mixed imports

### Step 4: Verify Bundle Optimization
- Test that type imports are properly eliminated in build output
- Verify no runtime errors from import changes
- Check that bundle sizes are optimized
- Expected outcome: Confirmed bundle optimization and no regressions

## Success Criteria

- [ ] All pure type imports use `import type { TypeName }` syntax
- [ ] All mixed imports use inline `type` modifiers where appropriate
- [ ] Bundle analysis shows type imports are eliminated from output
- [ ] No TypeScript compilation errors
- [ ] No runtime errors from import changes
- [ ] Consistent patterns across all packages

## Affected Components

- `src/examples/modules/*.ts` - ~77 module files with type imports
- `src/examples/projects/*.ts` - ~11 project files with type imports  
- `packages/editor/src/` - Cross-package type imports
- `packages/compiler/src/` - Type exports and imports
- `src/compiler-callback.ts` - Mixed imports with inline type modifiers
- `src/storage-callbacks.ts` - Type imports from editor package

## Risks & Considerations

- **Risk 1**: Breaking changes if types are accidentally used at runtime
  - **Mitigation**: Careful review of each import change, run tests
- **Risk 2**: Circular dependency issues with cross-package imports
  - **Mitigation**: Verify existing dependency structure remains intact
- **Dependencies**: None - this is a refactoring task
- **Breaking Changes**: None expected - this is purely a syntax improvement

## Related Items

- **Related**: TODO-004 (ts-ignore to ts-expect-error) - Both improve type safety
- **Related**: TODO-002 (editor package type safety) - Part of broader type safety improvements
- **Blocks**: None
- **Depends on**: None

## References

- [TypeScript 4.5+ Import Type Documentation](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#import-type)
- [TypeScript Import Type Best Practices](https://www.typescriptlang.org/docs/handbook/modules.html#importing-types)
- [Bundle Optimization with Import Type](https://webpack.js.org/guides/tree-shaking/)

## Notes

- This is a modern TypeScript best practice that improves bundle optimization
- The codebase already has good TypeScript configuration with `isolatedModules: true`
- Many files already follow the correct pattern - this standardizes the remaining ones
- Vite build system will benefit from proper type import elimination

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
