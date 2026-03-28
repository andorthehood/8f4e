---
title: 'TODO: Move memory declaration semantics into compiler semantic pass'
priority: High
effort: 1-2 days
created: 2026-03-27
status: Cancelled
completed: 2026-03-27
---

# 333 - Move memory declaration semantics into compiler semantic pass

- Priority: 🔴 High
- Effort: 1-2d
- Created: 2026-03-27
- Status: Cancelled

## Summary

The compiler now has a clearer semantic boundary:

- `@8f4e/tokenizer` owns `source -> AST`
- `packages/compiler/src/semantic/` owns namespace prepass and compile-time folding
- semantic-only AST lines no longer flow through module codegen

But memory declaration semantics are still duplicated.

Lines such as `int foo`, `float[] samples 128`, `int* ptr`, and similar declarations are still processed twice:

1. during semantic prepass, so `namespace.memory` exists for compile-time queries like `sizeof(samples)` and `count(samples)`
2. during module codegen, where the same declaration lines are compiled again to rebuild the final memory map/layout

That means the compiler still does not have a single semantic collection phase for declarations. The remaining duplication is specifically in memory declaration handling.

## Goal

Make memory declarations part of the semantic layer only once, then have codegen consume the semantic result instead of re-running declaration instruction compilers from source AST lines.

The target pipeline should be:

1. `@8f4e/tokenizer`: source -> AST
2. semantic declaration collection:
   - constants
   - `use`
   - module/constants scopes
   - memory declarations and their metadata
3. compile-time normalization / folding
4. codegen over a codegen-only view that does not re-run declaration semantics

## Problems To Remove

- Memory declarations are currently executed in both:
  - `prepassNamespace(...)`
  - `compileModule(...)`
- The semantic layer depends on instruction compilers for declaration meaning.
- Module codegen reconstructs memory metadata from declaration lines instead of consuming a semantic artifact.
- The final architecture still violates the intended “single semantic collection and inlining step” goal.

## Proposed Refactor

### 1. Create explicit semantic memory declaration handling

Inside `packages/compiler/src/semantic/`, add a dedicated declaration collector for memory instructions such as:

- `int`
- `float`
- `float64`
- pointer declarations
- array declarations
- declaration defaults and sizes

This collector should build the same memory metadata that codegen currently needs:

- element count
- element word size
- integer/float flags
- pointer flags
- addresses / word-aligned sizes
- defaults

without routing through the general instruction compiler table.

### 2. Make semantic prepass produce a reusable declaration artifact

The semantic step should produce something reusable by codegen, for example:

- normalized AST
- namespace
- memory map / memory plan
- module flags / scope metadata

The exact shape can vary, but it must be the canonical source of truth for declarations.

### 3. Stop feeding declaration lines into module codegen

Once memory declarations are handled semantically, `compileModule(...)` should stop re-running declaration lines entirely.

That means declaration instructions should be treated similarly to existing semantic-only lines:

- needed for semantic collection
- absent from actual codegen execution

### 4. Keep compile-time folding dependent on semantic metadata

Compile-time expressions like:

- `sizeof(bar)`
- `count(bar)`
- `123*sizeof(bar)`
- `SIZE*count(bar)`

should keep resolving during the semantic normalization stage, but now against the dedicated semantic declaration artifact instead of a namespace that was partially built by instruction compilers.

## Success Criteria

- Memory declarations are collected only once in the semantic layer.
- `compileModule(...)` no longer executes declaration instruction compilers for memory layout setup.
- Codegen consumes semantic declaration results instead of reconstructing them from AST declaration lines.
- Compile-time metadata queries continue to work for local and intermodule declarations.
- The compiler architecture now matches the intended phase split:
  - parse
  - semantic collection
  - folding
  - codegen

## Notes

This is the main remaining step after:

- 329 `Replace literal-only const collection with semantic namespace prepass`
- 330 `Centralize compile-time folding as an AST normalization pass`
- 331 `Delete duplicate downstream compile-time resolution paths`
- 332 `Extract syntax and AST parsing into a separate compiler package`

Cancelled on 2026-03-27.

This TODO assumed compiler-generated hidden storage would continue to participate in
module memory layout, just through a cleaner semantic pass. The newer plan is to keep
module/user memory fully determined by namespace collection and move compiler-generated
hidden resources into a separate internal address space with its own allocator.

That makes this TODO's proposed end state the wrong target rather than the next step.
