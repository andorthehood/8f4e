---
title: 'TODO: Resolve group memory exposures through an alias table'
priority: Medium
effort: 4-8h
created: 2026-08-26
issue: null
status: Completed
completed: 2026-08-26
---

# TODO: Resolve Group Memory Exposures Through an Alias Table

## Problem Description

Group memory exposures are currently lowered by `@8f4e/program-composer` after project composition. The composer walks
every validated AST argument and replaces a public reference such as `&audio:level` with its canonical backing
reference, such as `&audio/source:value`.

The rewrite updates both the structured `targetModuleId` and `targetMemoryId` fields and the argument's raw `value`
string. This works, but it makes project composition depend on tokenizer-owned source syntax. It also means the AST no
longer faithfully retains the source reference written by the project, and future changes to identifier syntax could
require corresponding changes in the composer.

Moving alias handling only into the general semantic-reference resolver is not sufficient. Layout-backed references
are resolved earlier by the memory-reference resolver, including pointer declaration defaults such as
`int* input &audio:level` and metadata queries such as `count(audio:buffer)`. A first-class alias contract therefore
needs to be available at the earliest layout-aware reference lookup and remain available to later semantic validation.

## Proposed Solution

Keep the composed AST source-faithful and make group memory exposures a first-class alias table carried beside the AST.
The table maps the public group reference to its canonical direct-module target:

```text
audio:level -> audio/source:value
```

Consumers must resolve aliases from the tokenizer's structured identifier fields. They must not inspect, replace, or
reparse the raw argument `value`.

Pass the alias table into the memory-reference resolver. Before looking up an intermodule memory declaration, resolve
the structured `targetModuleId` and `targetMemoryId` through the alias table and use the canonical target for address,
safe-range, pointer-provenance, and metadata-query facts. Keep the original AST argument unchanged so diagnostics and
source-oriented tooling continue to see the public reference.

Make the same alias lookup available to later semantic-reference validation for any address-shaped reference that was
not folded by the memory-reference pass. Once the memory plan exists, resolve compiled exposure metadata from the same
table and backing declaration. Missing backing modules or memory items should produce normal semantic diagnostics;
the exposure's declared public type must remain intentionally unchecked against the target type.

## Anti-Patterns

- Do not rewrite raw AST argument `value` strings.
- Do not reparse identifier source text in the composer or semantic compiler stages.
- Do not implement aliases only in the semantic-reference resolver; that is too late for pointer defaults and other
  layout-backed values.
- Do not mutate tokenizer-produced identifier nodes to hold canonical targets.
- Do not allocate memory for an exposure alias.
- Do not validate the exposure's declared public type against the backing memory declaration.
- Do not keep the existing AST rewrite as a compatibility fallback after alias-aware resolution is implemented.

## Implementation Plan

### Step 1: Define The Internal Alias Contract

- Define one compiler-internal alias lookup keyed by the public group module id and exposure memory name.
- Store the canonical target module id and memory id as structured fields.
- Have `composeProgram` populate the lookup from its composed project-memory exposures without changing any AST.
- Keep resolved public exposure metadata separate from the alias lookup's compiler-internal representation.

### Step 2: Make Layout-Aware Memory Resolution Alias-Aware

- Add the alias lookup to `ResolveMemoryReferencesInput` and `MemoryReferenceResolutionContext`.
- Centralize intermodule target resolution in a helper that first checks the alias table and then reads the memory plan.
- Route intermodule memory start/end addresses and `count`, `sizeof`, `max`, and `min` queries through that helper.
- Ensure resolved `AddressMetadata`, safe ranges, and pointer provenance identify the canonical backing module and
  memory item.
- Preserve the original AST argument and raw `value`; emit canonical resolved values only through the existing
  memory-reference fact-report layer.

### Step 3: Reuse Alias Resolution During Semantic Validation

- Make semantic intermodule-reference validation use the same alias lookup contract.
- Report missing canonical modules or memory items through the compiler semantic error domain.
- Resolve the compiled `projectMemoryExposuresByGroupPath` metadata from the same alias targets and memory plan.
- Cover unused invalid exposures so the compiler cannot return a resolved exposure with an undefined `targetMemory`.

### Step 4: Remove Composer AST Rewriting

- Delete `rewriteMemoryExposureReferences` and its invocation from `composeProgram`.
- Remove snapshots that assert canonical target text inside composed AST arguments.
- Replace them with assertions that the AST retains the public source reference while the alias table contains the
  canonical target.
- Do not retain aliases, deprecated exports, or migration shims for the removed rewrite path.

### Step 5: Add Cross-Pipeline Coverage

- Test pointer declaration defaults that reference a group exposure.
- Test ordinary start and end address references through an exposure.
- Test exposure-backed metadata queries, including references inside compile-time expressions.
- Test semantic diagnostics for missing target modules and memory items.
- Test that the compiler still returns the backing `PlannedMemoryDeclaration` used by editor connectors.

## Validation Checkpoints

- `npx nx run @8f4e/program-composer:test`
- `npx nx run @8f4e/memory-reference-resolver:test`
- `npx nx run @8f4e/semantic-reference-resolver:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run-many --target=typecheck --all`
- `rg -n "rewriteMemoryExposureReferences|argument\.value\.replace" packages/compiler`

## Success Criteria

- [x] Composed AST arguments retain their original public group-exposure references.
- [x] One structured alias lookup resolves exposure references to canonical backing memory.
- [x] Pointer defaults, address references, metadata queries, and compile-time expressions resolve through aliases.
- [x] Memory-reference facts and pointer provenance identify the canonical backing memory.
- [x] Semantic validation reports missing alias targets without returning undefined resolved metadata.
- [x] No compiler stage reparses or rewrites raw identifier source strings for exposure resolution.
- [x] The composer AST rewrite and all compatibility remnants are removed.
- [x] Exposure public types remain independent of backing declaration types.

## Affected Components

- `packages/compiler/packages/program-composer` - produce the alias table and stop rewriting AST arguments.
- `packages/compiler/packages/sub-program/packages/memory-reference-resolver` - resolve structured aliases during the
  earliest layout-aware reference pass.
- `packages/compiler/packages/sub-program/packages/semantic-reference-resolver` - reuse alias targets for validation.
- `packages/compiler/packages/sub-program` - pass the alias table through compilation and resolve compiled exposure
  metadata.
- `packages/compiler/packages/language-spec` - host shared alias types only if multiple compiler packages require a
  neutral contract.

## Risks & Considerations

- **Pipeline ordering**: Memory-reference resolution precedes general semantic-reference resolution. Alias support must
  follow that order or pointer defaults will regress.
- **Source fidelity**: Resolution facts may contain canonical address metadata, but tokenizer-produced AST arguments
  must remain unchanged.
- **Canonical provenance**: Runtime and editor memory mappings must continue to use the backing declaration's address,
  module id, and memory id rather than the public alias.
- **Error context**: Project exposure declarations do not currently carry compiler AST line metadata. Missing-target
  diagnostics need a deliberate source-context policy rather than a fabricated tokenizer line.
- **No compatibility burden**: The project has not been released, so replace the rewrite directly.

## Related Items

- **Related**: `docs/todos/477-establish-project-object-model.md`
- **Related**: `docs/todos/432-centralize-compile-time-metadata-query-resolution.md`
- **Related**: `docs/todos/429-unify-metadata-query-argument-shape.md`

## Notes

- Created after implementing group memory exposures and reviewing the compiler pipeline. The first implementation was
  intentionally small, but its AST rewrite couples composition to tokenizer syntax.
- The agreed direction is a source-faithful AST plus a structured alias table shared by layout-aware and semantic
  reference resolution.
