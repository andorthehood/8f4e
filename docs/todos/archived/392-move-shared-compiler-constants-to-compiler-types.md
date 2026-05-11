---
title: 'TODO: Move shared compiler constants to compiler-types'
priority: Medium
effort: 2-4h
created: 2026-05-06
status: Completed
completed: 2026-05-11
---

# TODO: Move shared compiler constants to compiler-types

## Problem Description

Some compiler-related constants are still owned by implementation packages even though they are part of the public contract consumed by editor state, web UI, compiler workers, or other packages.

`WASM_MEMORY_PAGE_SIZE` is now available through `@8f4e/compiler-types`, but other shared constants may still require callers to import from lower-level implementation packages or duplicate values locally. That leaks package internals into consumers and makes it easier for constants to drift.

## Proposed Solution

Audit compiler, compiler worker, editor state, web UI, and runtime packages for constants that represent shared contract values rather than implementation details.

Move or re-export those constants from `@8f4e/compiler-types` when they are stable public contract values. Keep constants inside implementation packages when they are genuinely private to code generation, parsing, rendering, or runtime internals.

## Implementation Plan

### Step 1: Audit constant usage

- Search for exported constants and repeated literal values across compiler-adjacent packages.
- Classify each value as public contract, package-private implementation detail, or local rendering/runtime concern.

### Step 2: Promote public contract constants

- Export public contract constants from `@8f4e/compiler-types`.
- Update consumers to import from `@8f4e/compiler-types` instead of lower-level packages.
- Avoid creating new dependencies from editor packages to implementation-only compiler packages.

### Step 3: Validate package boundaries

- Confirm package manifests match the new imports.
- Run focused typechecks for all affected packages.

## Success Criteria

- [x] Shared compiler contract constants are exported from `@8f4e/compiler-types`.
- [x] Editor-facing packages do not import implementation-only packages just for constants.
- [x] Remaining implementation constants are intentionally private.
- [x] Affected package typechecks pass.

## Affected Components

- `packages/compiler-types` - Public shared compiler contract constants.
- `packages/compiler` - Possible source or re-export location for implementation constants.
- `packages/compiler-worker` - Compiler API consumer.
- `packages/editor/packages/editor-state` - Editor state consumer.
- `packages/editor/packages/web-ui` - UI rendering consumer.
