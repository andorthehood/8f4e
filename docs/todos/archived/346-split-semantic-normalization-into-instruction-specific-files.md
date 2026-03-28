---
title: 'TODO: Split semantic normalization into instruction-specific files'
priority: Medium
effort: 4-8h
created: '2026-03-28'
status: Completed
completed: '2026-03-28'
---

# 346 - Split semantic normalization into instruction-specific files

## Problem Description

`packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` is accumulating instruction-specific behavior across multiple concerns:

- compile-time folding
- per-instruction normalization target selection
- undeclared identifier checks
- local existence checks
- push-specific semantic routing assumptions
- memory-declaration-specific normalization behavior

Current state:
- one central file owns normalization policy for many unrelated instructions
- instruction-specific semantic rules are expressed through a growing switch and special-case branches
- the file is becoming the semantic equivalent of the instruction-compiler sprawl that earlier refactors tried to reduce

Why this is a problem:
- instruction-specific behavior is harder to reason about and review
- adding new semantic normalization rules increases the risk of unrelated regressions
- the file will become a bottleneck as tokenizer classification and semantic validation continue to move earlier
- it is harder to align normalization structure with existing `semantic/instructions` and `semantic/declarations` folders

Impact:
- lower maintainability
- weaker ownership boundaries inside the semantic layer
- more friction for future typed-AST and semantics-package refactors

## Proposed Solution

Keep a shared semantic normalization entry point, but split instruction-specific logic into separate files under a dedicated normalization folder.

High-level approach:
- create `packages/compiler/src/semantic/normalization/`
- move instruction-specific normalization and semantic existence checks into per-instruction files
- keep shared compile-time argument resolution helpers centralized
- make the top-level normalization entry point a small dispatcher instead of a growing policy blob

Likely shape:
- `semantic/normalization/index.ts`
- `semantic/normalization/push.ts`
- `semantic/normalization/map.ts`
- `semantic/normalization/default.ts`
- `semantic/normalization/init.ts`
- `semantic/normalization/const.ts`
- `semantic/normalization/memoryDeclaration.ts`
- shared helper(s) for reusable compile-time argument folding

Alternative approaches considered:
- keep one large file and rely on comments/sections
  - rejected because it does not improve ownership or reduce coupling
- split only by helper function inside the same file
  - better than today, but still weaker than file-level ownership and discoverability

## Start Here

Current implementation entry point:
- `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts`

Recommended first extraction order:
1. `push`
2. `map`
3. `default`
4. `init`
5. memory declaration normalization
6. any remaining shared branch logic

Keep these shared concerns centralized unless a very small instruction-owned wrapper is clearly better:
- compile-time literal/const folding
- intermodule reference validation helpers
- shared "which argument indexes are normalizable" routing logic

This todo is a **structure refactor**, not a validation-ownership refactor. The semantic/codegen ownership established by `344` must remain unchanged while this work is done.

## Anti-Patterns

- Do not duplicate compile-time folding helpers in each instruction file.
- Do not move true tokenizer concerns into semantic normalization files.
- Do not create a generic hook system if a small explicit dispatcher is enough.
- Do not claim this TODO is complete after moving only one or two instruction branches out of the file.
- Do not mix this refactor with new semantic-behavior changes unless they are strictly required to preserve existing tests.
- Do not reopen `344` by reintroducing late codegen validation while splitting files.

## Implementation Plan

### Step 1: Introduce normalization folder and shared dispatcher
- Create `packages/compiler/src/semantic/normalization/`
- Move the current top-level logic into a thin dispatcher/orchestrator
- Keep behavior unchanged at this stage
- Leave `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` as the entry point until the split is complete, even if it becomes a wrapper over the new dispatcher

### Step 2: Extract the existing instruction-specific branches
- Move `map`/`default` handling into dedicated files
- Move `push` handling into its own file
- Move `const`, `init`, and memory-declaration handling into separate files as appropriate
- Keep shared compile-time folding utilities centralized
- After each extraction, verify that no new semantic or codegen ownership has been introduced accidentally

### Step 3: Clarify ownership and reduce cross-instruction branching
- Ensure each normalizer owns only its instruction-specific semantic behavior
- Remove instruction-name branching that is no longer needed in the dispatcher
- Add or move tests so they sit near the owning normalizer where appropriate
- Keep behavior-preserving regression coverage for:
  - local existence validation
  - `push` identifier validation
  - `map`/`default` unresolved identifier behavior
  - intermodule deferral behavior

## Validation Checkpoints

- `rg -n "line\\.instruction ===|case 'push'|case 'map'|case 'default'|case 'init'|case 'const'" packages/compiler/src/semantic`
  - should shrink in the top-level normalizer
- `rg -n "normalizeCompileTimeArguments" packages/compiler/src`
  - should still show a single stable semantic entry point, even if backed by a dispatcher
- `rg -n "UNDECLARED_IDENTIFIER|validateIntermodule|isMemoryIdentifier|isMemoryPointerIdentifier|isMemoryReferenceIdentifier" packages/compiler/src/semantic`
  - should help confirm that behavior moved structurally, not semantically
- `npx nx run compiler:test --skipNxCache`
- `npx nx run @8f4e/compiler:build --skipNxCache`

## Success Criteria

- [ ] `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` remains the single public semantic normalization entry point, but is reduced to a small dispatcher/wrapper rather than a large instruction-policy file.
- [ ] `push` normalization lives in its own file under `packages/compiler/src/semantic/normalization/`.
- [ ] `map` and `default` normalization live in their own file(s) under `packages/compiler/src/semantic/normalization/`.
- [ ] `init` normalization lives in its own file under `packages/compiler/src/semantic/normalization/`.
- [ ] memory declaration normalization lives in its own file under `packages/compiler/src/semantic/normalization/`.
- [ ] Shared compile-time folding helpers remain centralized and are not duplicated across instruction files.
- [ ] Existing semantic normalization behavior remains unchanged after the split:
  - local existence validation still happens in semantic normalization
  - `push` identifier validation still happens in semantic normalization
  - `map`/`default` unresolved identifiers still fail in semantic normalization
  - intermodule deferral still works during prepass
- [ ] The structure of semantic normalization matches the existing semantic ownership pattern used by `semantic/instructions` and `semantic/declarations`.
- [ ] The TODO is not marked complete until the top-level file is no longer acting as a multi-instruction policy hub.

## Affected Components

- `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` - current central normalization entry point
- `packages/compiler/src/semantic` - home for the new normalization folder and dispatcher
- `packages/compiler/src/compiler.ts` - caller of the normalization entry point
- instruction/compiler tests covering `push`, `map`, `default`, `init`, `const`, and memory declarations

## Risks & Considerations

- **Risk 1**: Splitting too early without shared helpers could duplicate logic. Mitigation: extract shared compile-time resolution helpers first or keep them centralized.
- **Risk 2**: Behavior-preserving refactor could accidentally change error timing. Mitigation: keep tests green and add targeted regression coverage where behavior is subtle.
- **Dependencies**: Pairs naturally with `344` and `345`, but does not strictly depend on them.
- **Breaking Changes**: Internal-only structure change; no external release compatibility concerns.

## Related Items

- **Blocks**: None directly
- **Depends on**: None
- **Related**: `344`, `345`

## References

- [344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md](/docs/todos/344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md)
- [345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md](/docs/todos/345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md)

## Notes

- This is primarily a semantic-layer maintainability refactor, not a behavior change.
- A good first split is likely `push`, `map`, and `default`, because they already carry distinctive semantic normalization behavior.
- If the extraction reveals shared helper seams that deserve their own file, that is in scope.
- If the extraction requires new TODOs for follow-up cleanup, add them, but do not use those as a reason to mark this one complete early.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
