---
title: 'TODO: Derive memory size from compiled program footprint'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Open
completed: null
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

## Proposed Solution

Make program memory sizing automatic by default.

High-level approach:

- Stop treating authored `memorySizeBytes` as required project input.
- Let the compiler determine the required static memory footprint from declarations and compiled module layout.
- Derive the effective runtime memory size from that footprint.
- Round the result up to a WebAssembly page boundary and add a small fixed headroom to avoid unnecessary memory recreation while editing.

The current `memorySizeBytes` option effectively plays two roles:

- compile-time memory limit / addressable memory ceiling
- actual allocated `WebAssembly.Memory` size

This TODO should separate those roles clearly so the compiler is not forced to depend on manually-authored memory config when it can derive the required size itself.

Recommended behavior:

- compiler computes `allocatedMemorySize`
- shared compile pipeline derives `effectiveMemorySizeBytes`
- runtime memory creation uses `effectiveMemorySizeBytes`
- manual memory override remains optional for tests or unusual runtime constraints

## Anti-Patterns

- Do not move `memorySizeBytes` into the editor-only directive system.
- Do not keep requiring users to author a manual memory size when the compiler can derive it.
- Do not use exact-fit memory without page rounding.
- Do not implement editor-only auto-sizing while leaving CLI/compiler-worker on different logic.
- Do not let binary asset loading implicitly alter memory sizing; assets must continue loading into declared memory only.

## Implementation Plan

### Step 1: Separate required footprint from configured limit
- Audit all places where `memorySizeBytes` is used in `@8f4e/compiler`, `compiler-worker`, editor-state, and CLI.
- Split the current concept into:
  - required compiled memory footprint
  - effective runtime memory size
- Update naming and types so this distinction is explicit.

### Step 2: Derive effective memory size from compilation output
- Use compiler-reported `allocatedMemorySize` as the base requirement.
- Add a shared helper that:
  - adds a small fixed safety margin
  - rounds up to 64 KiB WebAssembly pages
- Reuse the same derivation logic in editor, CLI, and compiler-worker paths.

### Step 3: Remove required project-config dependence
- Make project compilation work without authored `memorySizeBytes` in project config.
- Keep backward compatibility for existing projects during migration.
- Treat manual memory size as an optional override instead of a required field.

### Step 4: Update runtime memory creation and recreation rules
- Feed derived effective memory size into `WebAssembly.Memory` creation.
- Ensure memory recreation reasons remain accurate when required size changes after edits.
- Preserve existing behavior for memory-structure changes and page-granular allocation.

### Step 5: Add tests and docs
- Add compiler, compiler-worker, CLI, and editor-state coverage for automatic sizing.
- Add regression tests showing that projects compile successfully without authored `memorySizeBytes`.
- Update docs and examples to stop recommending manual memory sizing except for explicit overrides.

## Validation Checkpoints

- `npx nx run-many --target=test --projects=compiler,compiler-worker,cli,editor`
- `npx nx run-many --target=typecheck --projects=compiler,compiler-worker,cli,editor`
- `rg -n "memorySizeBytes|allocatedMemorySize|Memory limit exceeded" packages/compiler packages/compiler-worker packages/cli packages/editor`

## Success Criteria

- [ ] Projects can compile and run without authored `memorySizeBytes` in project config.
- [ ] Effective runtime memory size is derived from compiled program footprint.
- [ ] Derived memory size is rounded to WebAssembly page boundaries and includes a small safety margin.
- [ ] Editor, CLI, and compiler-worker use the same memory-sizing logic.
- [ ] Existing projects with explicit `memorySizeBytes` remain supported as overrides during migration.
- [ ] Tests cover both auto-sized and manual-override paths.

## Affected Components

- `packages/compiler/src/` - required memory footprint derivation and memory-limit semantics
- `packages/compiler-worker/src/` - memory creation/recreation sizing logic
- `packages/cli/src/` - shared compile pipeline and project compilation defaults
- `packages/editor/packages/editor-state/src/features/program-compiler/` - effective compiler options in editor
- `packages/editor/packages/editor-state/src/features/project-config/` - remove required dependence on authored `memorySizeBytes`
- `docs/usage.md` - project config and memory sizing documentation
- `packages/examples/src/projects/` - examples that currently hard-code `memorySizeBytes`

## Risks & Considerations

- **Two-role config field**: current code uses `memorySizeBytes` both as a compile-time ceiling and runtime allocation size, so refactoring must avoid semantic drift.
- **Compile pipeline ordering**: if compile-time checks currently require a memory limit before layout is finalized, the pipeline may need a staged or refactored derivation flow.
- **Memory churn**: exact-fit auto-sizing would recreate memory too often while editing; use fixed headroom.
- **Compatibility**: existing configs and tests may assume `memorySizeBytes` is always present.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`
- **Related**: `docs/todos/310-simplify-compiler-project-flattening-and-compilable-block-checks.md`
- **Related**: `docs/todos/308-simplify-memory-instruction-default-value-resolution.md`

## Notes

- Current discussion conclusion: binary assets are not a blocker because they only load into already-allocated declared memory spaces.
- Preferred default sizing policy is minimum required size plus a small fixed buffer, then rounded to full Wasm pages.
