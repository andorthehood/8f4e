---
title: 'TODO: Derive memory size from compiled program footprint'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Open
completed: null
github_issue: 'https://github.com/andorthehood/8f4e/issues/429'
---

# TODO: Derive memory size from compiled program footprint

## Problem Description

Projects currently author `memorySizeBytes` manually in project config even though the compiler already computes the actual static memory footprint required by the program.

That creates a few unnecessary problems:

- users have to guess or tune memory size manually
- small source edits can fail with `Memory limit exceeded` if config was not updated
- oversized memory config becomes stale technical debt in projects
- the same concept is currently split between authored project config and compiler/runtime reality

In this codebase, binary assets are loaded into already-declared memory regions, so they do not introduce hidden memory allocation requirements beyond the compiler-visible declarations. That means the program's required memory is derivable from the compiled memory layout.

The compiler already produces the memory allocation plan that determines the final static layout. In 8f4e, that plan is not dynamic at runtime; only a later successful recompilation can produce a different one.

## Proposed Solution

Make program memory sizing automatic by default.

High-level approach:

- Stop treating authored `memorySizeBytes` as required project input.
- Let the compiler determine the required static memory footprint from the generated memory allocation plan.
- Derive the effective runtime memory size directly from that footprint.
- Round the result up to a WebAssembly page boundary with a minimum allocation of one page.

The current `memorySizeBytes` option effectively plays two roles:

- compile-time memory limit / addressable memory ceiling
- actual allocated `WebAssembly.Memory` size

This TODO should remove the authored project-config role entirely so runtime allocation follows the compiler-generated plan instead of user-maintained config.

Recommended behavior:

- compiler computes the required memory footprint from the allocation plan
- shared compile pipeline derives `effectiveMemorySizeBytes`
- `effectiveMemorySizeBytes = max(WASM_PAGE_SIZE, roundUpToPage(requiredBytes))`
- runtime memory creation uses `effectiveMemorySizeBytes`
- failed recompilation keeps the last valid compiled program and memory instance
- successful recompilation may replace memory if the newly derived size changes

## Anti-Patterns

- Do not move `memorySizeBytes` into the editor-only directive system.
- Do not keep requiring users to author a manual memory size when the compiler can derive it.
- Do not use exact-fit memory without page rounding.
- Do not implement editor-only auto-sizing while leaving CLI/compiler-worker on different logic.
- Do not let binary asset loading implicitly alter memory sizing; assets must continue loading into declared memory only.
- Do not add a fixed headroom policy unless a separate design decision explicitly introduces one.
- Do not change memory sizing on failed recompilation; the live editor must retain the last valid memory.

## Implementation Plan

### Step 1: Make compiler footprint the source of truth
- Audit all places where `memorySizeBytes` is used in `@8f4e/compiler`, `compiler-worker`, editor-state, and CLI.
- Define the compiler-produced memory allocation plan / required footprint as the source of truth.
- Update naming and types so the distinction between required bytes and allocated bytes is explicit.

### Step 2: Derive effective memory size from compilation output
- Use the compiler-reported required memory footprint as the base requirement.
- Add a shared helper that:
  - rounds up to 64 KiB WebAssembly pages
  - guarantees a minimum of one page
- Reuse the same derivation logic in editor, CLI, and compiler-worker paths.

### Step 3: Remove project-config dependence
- Make project compilation work without authored `memorySizeBytes` in project config.
- Remove `memorySizeBytes` from active project config authoring and examples.
- Decide how to treat legacy saved compiled config fields, but do not keep them as active source-of-truth input.

### Step 4: Update runtime memory creation and recreation rules
- Feed derived effective memory size into `WebAssembly.Memory` creation.
- Ensure memory recreation reasons remain accurate when required size changes after successful edits.
- Keep the last valid program and memory when recompilation fails.
- Preserve existing behavior for memory-structure changes and page-granular allocation.

### Step 5: Add tests and docs
- Add compiler, compiler-worker, CLI, and editor-state coverage for automatic sizing.
- Add regression tests showing that projects compile successfully without authored `memorySizeBytes`.
- Update docs and examples to stop recommending manual memory sizing.

## Validation Checkpoints

- `npx nx run-many --target=test --projects=compiler,compiler-worker,cli,editor`
- `npx nx run-many --target=typecheck --projects=compiler,compiler-worker,cli,editor`
- `rg -n "memorySizeBytes|allocatedMemorySize|Memory limit exceeded" packages/compiler packages/compiler-worker packages/cli packages/editor`

## Success Criteria

- [ ] Projects can compile and run without authored `memorySizeBytes` in project config.
- [ ] Effective runtime memory size is derived from the compiler memory allocation plan.
- [ ] Derived memory size is rounded to WebAssembly page boundaries with a minimum of one page.
- [ ] Editor, CLI, and compiler-worker use the same memory-sizing logic.
- [ ] Failed recompilation keeps the last valid compiled program and memory.
- [ ] Tests cover both successful size changes and failed recompilation retention.

## Affected Components

- `packages/compiler/src/` - required memory footprint derivation and memory-limit semantics
- `packages/compiler-worker/src/` - memory creation/recreation sizing logic
- `packages/cli/src/` - shared compile pipeline and project compilation defaults
- `packages/editor/packages/editor-state/src/features/program-compiler/` - effective compiler options in editor
- `packages/editor/packages/editor-state/src/features/project-config/` - remove required dependence on authored `memorySizeBytes`
- `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts` - show allocated pages and actual used memory separately
- `docs/usage.md` - project config and memory sizing documentation
- `packages/examples/src/projects/` - examples that currently hard-code `memorySizeBytes`

## Risks & Considerations

- **Compile pipeline ordering**: if compile-time checks currently require a memory limit before layout is finalized, the pipeline may need a staged or refactored derivation flow.
- **Failed compile retention**: live-editor behavior depends on keeping the last valid compiled program and memory after temporary compiler errors.
- **Compatibility**: existing configs, fixtures, and tests may assume `memorySizeBytes` is always present.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`
- **Related**: `docs/todos/310-simplify-compiler-project-flattening-and-compilable-block-checks.md`
- **Related**: `docs/todos/308-simplify-memory-instruction-default-value-resolution.md`

## Notes

- Current discussion conclusion: binary assets are not a blocker because they only load into already-allocated declared memory spaces.
- Current policy:
  - compiler memory allocation plan is the source of truth
  - derive required bytes from that plan
  - allocate `max(1 page, roundUpToPage(requiredBytes))`
  - retain last valid memory on failed recompilation
  - show allocated pages and actual used memory separately in the info overlay
