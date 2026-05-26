---
title: 'TODO: Split namespace discovery and layout prepass'
priority: Medium
effort: 2-4h
created: 2026-05-26
issue: null
status: Done
completed: 2026-05-26
---

# TODO: Split namespace discovery and layout prepass

## Problem Description

`packages/compiler/src/semantic/buildNamespace.ts` currently uses `prepassNamespace(...)` for two different jobs:

- an early namespace-discovery pass that gathers module/constant namespaces while deferring unresolved intermodule defaults;
- a full layout/default-resolution pass once the needed namespaces are available.

After removing a compatibility-style wrapper that rebuilt a typed AST with replacement `lines`, the distinction is represented by a `NamespacePrepassMode` argument with values such as `'namespace-discovery'` and `'full'`.

That mode parameter is better than creating a hybrid AST object, but it is still a design smell. It makes one function contain two subtly different semantics and asks future agents to understand why default handling changes based on a mode flag. The compiler should expose explicit internal functions for the two phases instead of a generic prepass function with a behavior switch.

## Proposed Solution

Refactor namespace processing into explicit, phase-specific paths.

The intended shape is:

- a namespace discovery function that only performs the work needed to establish available namespaces and memory declarations without resolving defaults that require complete namespace state;
- a full namespace layout/default-resolution function that performs final memory layout and scalar default resolution once discovery is complete;
- shared low-level helpers only where they represent genuinely identical behavior, not a hidden compatibility layer.

Keep the parsed AST objects untouched. If a phase needs a simplified memory declaration form for discovery, pass that simplified line directly to the declaration handler or model the discovery operation explicitly. Do not rebuild a `ModuleAST`/`ConstantsAST` with altered `lines`.

## Anti-Patterns

- Do not keep a generic `mode` option that changes `prepassNamespace(...)` behavior.
- Do not recreate a typed AST object with replacement `lines`.
- Do not preserve old behavior through aliases, wrappers, or compatibility shims.
- Do not hide phase differences behind broad names like `prepass` when the call sites need discovery vs layout semantics.
- Do not add fallback runtime checks for states that the phase-specific function signature can make explicit.

## Implementation Plan

### Step 1: Name the phases

- Review `collectNamespacesFromASTs(...)` and identify the exact work done during namespace discovery vs final layout.
- Introduce explicit function names that describe those responsibilities.
- Keep the current behavior intact while making call sites read as discovery or layout work.

### Step 2: Split the implementation

- Move the discovery-only memory declaration handling out of `prepassNamespace(...)` mode branching.
- Keep full layout/default resolution in a separate path.
- Remove `NamespacePrepassMode` once the behavior is represented by function boundaries.

### Step 3: Verify no compatibility object remains

- Confirm no code creates `{ ...ast, lines: ... }` for typed AST objects.
- Confirm namespace collection no longer uses a behavior mode flag.
- Confirm compiler callers consume the same typed AST objects they were passed.

## Validation Checkpoints

- `rg -n "NamespacePrepassMode|namespace-discovery|toNamespaceDiscoveryAst|\\.\\.\\.ast,\\s*lines" packages/compiler/src packages/compiler-spec/src -g '*.ts'`
- `npx nx run compiler:typecheck`
- `npx nx run compiler:test`

## Success Criteria

- [x] Namespace discovery and full layout/default resolution are separate, clearly named internal functions.
- [x] `prepassNamespace(...)` no longer has a mode flag.
- [x] No typed AST object is rebuilt with replacement `lines`.
- [x] Behavior remains covered by compiler namespace, intermodule-reference, and memory declaration tests.

## Affected Components

- `packages/compiler/src/semantic/buildNamespace.ts` - namespace discovery and layout/default-resolution flow.
- `packages/compiler/src/compiler.ts` - module compilation call site if the full prepass function is renamed.
- `packages/compiler/src/index.ts` - namespace collection call sites if exported helper names change.

## Related Items

- **Follows up**: `docs/todos/420-add-typed-compiler-ast-group-indexes.md`
- **Related**: `docs/todos/421-clean-up-ast-construction-helper-scans.md`
- **Related**: `docs/todos/406-review-compiler-namespace-prepass-repetition.md`
- **Related**: `docs/agent_failure_notes/055-preserving-compatibility-after-no-compatibility-instruction.md`

## Notes

- This todo is not about preserving compatibility. The project is unreleased; update callers directly and delete transitional shapes.
- The immediate goal is clarity and honesty of phase interfaces. Broader optimization of repeated namespace work can stay in TODO 406 unless it naturally falls out of the split.
