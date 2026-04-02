---
title: 'TODO: Consolidate declaration compilers into a single factory'
priority: Low
effort: 2-4h
created: 2026-04-02
status: Open
completed: null
---

# TODO: Consolidate declaration compilers into a single factory

## Problem Description

- The declaration compilers (`int.ts`, `int8.ts`, `int16.ts`, `float.ts`, `float64.ts`) are nearly identical — each follows the same five-step pattern with only minor per-type differences.
- Adding a new type means copying an entire file and changing a base type string and a truncation flag, which is error-prone boilerplate.
- The duplication also means any structural change to declaration compilation must be repeated across every file.

## Proposed Solution

Replace the per-type files with a single `createDeclarationCompiler(baseType)` factory that returns an `InstructionCompiler`. The factory would parameterize:

- The base type string (for `getMemoryFlags`).
- Whether to truncate the default value to an integer.
- The `elementWordSize` for non-pointer variants (4 for int/float, 8 for float64 — pointers are always 4).

Registration in `index.ts` would become one-liner entries:

```ts
const int = createDeclarationCompiler('int');
const int8 = createDeclarationCompiler('int8');
// ...
```

Breaking internal APIs is fine — the software has not been released and we own the entire pipeline, so no fallback logic is needed.

## Implementation Plan

### Step 1: Create `createDeclarationCompiler` factory
- Extract the shared pattern from an existing declaration compiler into a parameterized factory function in a new or existing utils file.
- Accept base type, truncation flag, and non-pointer element word size as parameters.

### Step 2: Replace per-type files
- Rewrite each declaration compiler file to call the factory, or collapse them into `index.ts` directly.
- Move in-source tests to a shared test suite parameterized by base type.

### Step 3: Clean up
- Delete the now-empty per-type files if all logic lives in the factory + index.
- Update imports.

## Success Criteria

- [ ] A single factory function produces all declaration compilers.
- [ ] Adding a new scalar/pointer type requires only a factory call and a type registration — no new file.
- [ ] All existing tests pass.

## Affected Components

- `packages/compiler/src/semantic/declarations/int.ts`
- `packages/compiler/src/semantic/declarations/int8.ts`
- `packages/compiler/src/semantic/declarations/int16.ts`
- `packages/compiler/src/semantic/declarations/float.ts`
- `packages/compiler/src/semantic/declarations/float64.ts`
- `packages/compiler/src/semantic/declarations/index.ts`

## Risks & Considerations

- **Low risk**: Pure internal refactor with no effect on compilation output.
- **Sequencing**: Best done after TODO #355 (replace pointee booleans with `pointeeBaseType`), since the factory benefits from a simpler `getMemoryFlags` signature.

## Related Items

- **Depends on**: TODO #355 — Replace `isPointingToInt8`/`isPointingToInt16` booleans with a single `pointeeBaseType` field (recommended but not strictly required).
