---
title: 'TODO: Expose sprite-generator color helpers for custom scheme derivation'
priority: Medium
effort: 0.5-1d
created: 2026-01-22
status: Open
completed: null
---

# TODO: Expose sprite-generator color helpers for custom scheme derivation

## Problem Description

Color schemes are currently authored as fully-specified `ColorScheme` objects. Users want to derive their own palettes (lighten/darken/alpha/mix) without being locked into a fixed base-color model, but there are no shared helper utilities exposed from `@8f4e/sprite-generator`.

## Proposed Solution

Expose a small set of RGB helper functions from `@8f4e/sprite-generator` that accept common string inputs (`#rgb`, `#rrggbb`, `rgba(r,g,b,a)`) and return standardized `rgba(r,g,b,a)` strings. Users can then build derived color schemes however they want while still supplying the full `ColorScheme` shape.

## Implementation Plan

### Step 1: Add color helpers to sprite-generator
- Implement helpers such as `lighten`, `darken`, `alpha`, and `mix`
- Accept hex and rgba inputs; always return `rgba(r,g,b,a)`
- Keep helpers side-effect free and deterministic

### Step 2: Export helpers publicly
- Export helpers from `packages/editor/packages/sprite-generator/src/index.ts`
- Document helper usage in the package README

### Step 3: Add tests
- Cover hex parsing, rgba parsing, clamping, and expected output strings
- Include edge cases for alpha and mix ranges

## Success Criteria

- [ ] Consumers can import and use color helpers from `@8f4e/sprite-generator`
- [ ] Helpers accept hex and rgba inputs and always return `rgba(r,g,b,a)`
- [ ] Tests verify color parsing, mixing, and clamping behavior

## Affected Components

- `packages/editor/packages/sprite-generator/src/*` (new helpers module)
- `packages/editor/packages/sprite-generator/src/index.ts`
- `packages/editor/packages/sprite-generator/README.md`
- `packages/editor/packages/sprite-generator/tests/*`

## Risks & Considerations

- Ensure helper output matches browser canvas expectations for `fillStyle`
- Keep parsing tolerant but strict enough to catch malformed inputs

## Related Items

- **Related**: Color scheme files in `src/colorSchemes/*`
- **Related**: `packages/editor/packages/sprite-generator/src/types.ts`
