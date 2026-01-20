---
title: 'TODO: Add [] append slot syntax to stack-config paths'
priority: Medium
effort: 1-2 days
created: 2026-01-20
status: Completed
completed: 2026-01-20
---

# TODO: Add [] append slot syntax to stack-config paths

## Problem Description

The stack-config-compiler currently requires explicit numeric array indices (e.g. `items[0]`) when scoping into arrays or setting values. This makes it awkward to append new array elements in config programs, especially for object elements. The language already has an `append` instruction, but there is no path-level shorthand for “use the next available slot” within array paths.

Desired usage:
- `rescope "binaryAssets[]"` followed by `scope "url"` should append a new object element and set `url` on that new element.
- `binaryAssets[].url` should be valid and behave the same as above.

This improves ergonomics for building array items in config programs without requiring manual index tracking.

## Proposed Solution

Introduce `[]` as a special array path segment meaning “append slot.” The segment should be accepted anywhere array indices are currently accepted, and it should be allowed in all path-taking commands.

### Semantics
- `[]` is allowed in `scope`, `rescope`, `rescopeTop`, and `rescopeSuffix` path arguments.
- `set` on a path containing `[]` appends the value at the append slot (option 1 behavior).
- `append` continues to work as-is; if a path contains `[]`, it appends to the newly created slot, not to an existing array element.
- `binaryAssets[]` then `scope "url"` should create a new object element and set `url` on that element.
- `binaryAssets[].url` should be valid and equivalent to the two-step form above.

### Schema Validation
- `[]` should validate the same way as any array index: only allowed when the schema node is an array.

## Implementation Plan

### Step 1: Parsing and path splitting
- Update path splitting to recognize `[]` as a segment alongside numeric indices.
- Ensure path parsing no longer errors on empty brackets.

### Step 2: VM navigation behavior
- Extend array index detection to recognize `[]` as an append sentinel.
- Update path navigation to:
  - When encountering `[]`, append a new element to the current array.
  - If the next segment is a property, initialize the appended element to `{}`.
- Ensure `setAtPath` handles `[]` (appends instead of overwriting).
- Ensure `appendAtPath` behaves predictably when `[]` is in the path.

### Step 3: Schema navigation updates
- Treat `[]` as array index when validating navigation and when looking up schema nodes.

### Step 4: Tests
- Unit tests for path splitting with `[]` (e.g., `items[]`, `items[].name`).
- VM navigation tests to verify append-slot behavior and object creation.
- Compile tests covering:
  - `binaryAssets[]` + `scope "url"`
  - `binaryAssets[].url`
- Update snapshots for the comprehensive example test if needed.

## Success Criteria

- [ ] `binaryAssets[]` + `scope "url"` + `set` appends a new object and sets `url`.
- [ ] `binaryAssets[].url` works with `set` and produces the same result.
- [ ] Schema validation rejects `[]` when the schema node is not an array.
- [ ] Tests cover the new syntax and pass via Nx/Vitest.

## Affected Components

- `packages/stack-config-compiler/src/utils.ts` - path splitting regex update.
- `packages/stack-config-compiler/src/parser/splitPath.ts` - path parsing behavior.
- `packages/stack-config-compiler/src/vm/isArrayIndex.ts` - recognize `[]`.
- `packages/stack-config-compiler/src/vm/getArrayIndex.ts` - support append sentinel.
- `packages/stack-config-compiler/src/vm/navigateToPath.ts` - append-slot navigation.
- `packages/stack-config-compiler/src/vm/setAtPath.ts` - set behavior with `[]`.
- `packages/stack-config-compiler/src/vm/appendAtPath.ts` - append behavior with `[]`.
- `packages/stack-config-compiler/src/schema/validateNavigationSegment.ts` - allow `[]` for arrays.
- `packages/stack-config-compiler/src/schema/lookupSchemaNode.ts` - treat `[]` as array index.
- `packages/stack-config-compiler/src/__tests__/*` - new tests and snapshots.

## Risks & Considerations

- **Ambiguity**: `set` now behaves like `append` when `[]` appears in the path. Document clearly.
- **Schema alignment**: Must ensure `[]` does not bypass array-type checks.
- **Backward compatibility**: This is additive syntax but must not break existing path parsing.

## Related Items

- **Related**: `docs/todos/archived/109-stack-config-concat-instruction.md`
- **Related**: `docs/todos/archived/114-stack-config-rescope-suffix-instruction.md`

## Notes

Example target program (should compile after change):

```
rescope "binaryAssets[]"

const PROTOCOL "https://"
const DOMAIN "llllllllllll.com"
const SUBDOMAIN "static"
const PATH "/andor/8f4e/"
const SAMPLE "amen"
const BPM "170bpm"
const RES "8bit"
const SIGNEDNESS "unsigned"
const EXT ".pcm"

scope "url"
push PROTOCOL
push SUBDOMAIN
push "."
push DOMAIN
push PATH
push SAMPLE
push "_"
push BPM
push "_"
push RES
push "_"
push SIGNEDNESS
push EXT
concat
set

rescopeTop "memoryId"
push "pcmPlayer8bit.buffer"
set
```
