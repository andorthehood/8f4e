---
title: 'TODO: Investigate Using 8f4e Compiler for Config'
priority: Medium
effort: 1-2d
created: 2026-02-25
status: Open
completed: null
---

# TODO: Investigate Using 8f4e Compiler for Config

## Problem Description

The app currently uses `@8f4e/stack-config-compiler` for config blocks and `@8f4e/compiler` for module/function compilation.
This split creates:
- Two language/tooling surfaces to maintain
- Extra startup bundle weight in the main client (config compiler code is currently eagerly imported)
- Potentially duplicated parsing and validation concepts across compilers

We should evaluate whether config compilation can be implemented on top of the main 8f4e compiler pipeline (or a shared compiler core) without regressing editor behavior.

## Proposed Solution

Run a focused feasibility investigation and produce a decision document with one of these outcomes:
- **Proceed**: define a migration plan to compile config via `@8f4e/compiler`
- **Hybrid**: extract shared parser/runtime pieces while keeping separate public compilers
- **Do not proceed**: keep current split with documented rationale and targeted optimizations

The investigation should compare correctness, complexity, performance, and bundle-size impact.

## Anti-Patterns (Optional)

- Do not start a full migration before feasibility and risk are validated.
- Do not change user-facing config semantics during investigation.
- Do not couple editor UX to speculative compiler internals.

## Implementation Plan

### Step 1: Define compatibility requirements
- Enumerate current stack-config features and behaviors (scope ops, schema checks, error mapping, block indexing, required-field checks, combinator validation).
- Document which features must remain identical.

### Step 2: Prototype integration approaches
- Implement minimal spikes for:
  - compiling config via `@8f4e/compiler`, or
  - extracting shared parsing/execution pieces between compilers.
- Measure effort and identify architectural blockers.

### Step 3: Compare tradeoffs and decide
- Compare:
  - bundle/startup impact
  - compile-time/runtime performance
  - implementation complexity
  - test migration cost
  - long-term maintainability
- Publish recommendation and, if approved, follow-up implementation TODOs.

## Validation Checkpoints (Optional)

- `npx nx run-many --target=test --all`
- `npx nx run-many --target=typecheck --all`
- `npx nx run app:build -- --emptyOutDir`
- Verify current config fixtures produce equivalent outputs/errors in prototype path.

## Success Criteria

- [ ] Feasibility report produced with clear recommendation (proceed/hybrid/do-not-proceed)
- [ ] Bundle impact estimate documented for startup path
- [ ] Behavioral parity matrix created for current config language features
- [ ] Risks, migration cost, and rollback strategy documented

## Affected Components

- `packages/stack-config-compiler` - current config compiler behavior and tests
- `packages/compiler` - candidate shared/extended compiler path
- `src/editor.ts` - config compiler callback wiring and lazy-load strategy
- `src/storage-callbacks.ts` and config-related editor-state effects - validation/error flow expectations

## Risks & Considerations

- **Semantic drift**: config behavior may diverge from current rules; mitigate with parity tests and fixtures.
- **Migration churn**: broad refactors can touch parser/runtime/test layers; mitigate with phased rollout.
- **Error UX regressions**: block-indexed line mapping must stay stable for editor error display.
- **Dependencies**: may depend on shared parser/runtime extraction before migration is practical.
- **Breaking Changes**: avoid user-visible config language changes in initial migration.

## Related Items

- **Related**: [213-add-macro-support-to-stack-config-language.md](./213-add-macro-support-to-stack-config-language.md)
- **Related**: [274-consolidate-default-feature-flags-source.md](./274-consolidate-default-feature-flags-source.md)

## References

- [src/editor.ts](/Users/andorpolgar/git/8f4e/src/editor.ts)
- [packages/stack-config-compiler](/Users/andorpolgar/git/8f4e/packages/stack-config-compiler)
- [packages/compiler](/Users/andorpolgar/git/8f4e/packages/compiler)

## Notes

- This TODO is investigation-only and should result in a recommendation plus follow-up TODOs, not a direct migration.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
