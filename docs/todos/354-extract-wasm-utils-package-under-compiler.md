---
title: 'TODO: Extract WASM Utils to Separate Package'
priority: Medium
effort: 3 hours
created: 2026-03-31
status: Open
completed: null
---

# TODO: Extract WASM Utils to Separate Package

## Problem Description

The WASM utility functions (low-level encoding, section helpers, and instruction definitions) are currently located within the `compiler` package. These utilities are independent of the high-level compiler logic and could be reused by other tools.

- Current state: WASM utilities are in `packages/compiler/src/wasmUtils`.
- Why is this a problem? Tightly coupling low-level WASM generation helpers with the main compiler makes it harder to reuse them in other contexts (e.g., a standalone WASM inspector or a different compiler frontend) without dragging in the entire compiler dependency tree.
- Impact: Improved modularity and cleaner separation of concerns.

## Proposed Solution

Extract the `wasmUtils` directory into a new package named `wasm-utils` nested under the `compiler` package in the `packages/` subdirectory.

- High-level approach: Create `packages/compiler/packages/wasm-utils` and move the contents of `packages/compiler/src/wasmUtils` there.
- Key changes required: Update all internal and external imports to reference the new package.

## Implementation Plan

### Step 1: Initialize New Package
- Create `packages/compiler/packages/wasm-utils` directory.
- Setup `package.json`, `tsconfig.json`, and Nx project configuration.
- Register the package in the workspace root `tsconfig.json` paths.

### Step 2: Move Source Files
- Move `packages/compiler/src/wasmUtils/*` to `packages/compiler/packages/wasm-utils/src/`.
- Ensure all utilities are correctly exported via `packages/compiler/packages/wasm-utils/src/index.ts`.

### Step 3: Update Imports
- Update imports in `packages/compiler/src/wasmBuilders` and other compiler files to use `@8f4e/compiler-wasm-utils`.
- Run a full build to verify integration.

### Step 4: Move Tests
- Move relevant tests from `packages/compiler/__tests__` (if any specifically for wasmUtils) or in-source tests to the new package.

## Success Criteria

- [ ] `packages/compiler/packages/wasm-utils` exists as a standalone nested package.
- [ ] `packages/compiler` successfully builds using the new package as a dependency.
- [ ] All WASM utility tests pass.

## Affected Components

- `packages/compiler/src/wasmUtils` - To be moved.
- `packages/compiler/packages/wasm-utils` - New package.
- `packages/compiler/src/wasmBuilders` - Imports will need updating.

## Related Items

- **Related**: #353 (Nest tokenizer package under compiler)

## Notes

- This TODO specifically excludes `wasmBuilders`, which will remain in the `compiler` package for now as they are more closely tied to the compiler's intermediate representations.
- This follows the nested package pattern introduced for the tokenizer.
