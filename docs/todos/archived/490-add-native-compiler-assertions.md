---
title: 'TODO: Add Native Compiler Assertions'
priority: Medium
effort: 2-3d
created: 2026-10-09
issue: null
status: Completed
completed: 2026-10-09
---

# TODO: Add Native Compiler Assertions

## Problem Description

Project assertions currently use ordinary `call assert` instructions. The shared `@8f4e/test-runner` instruments them
with a nested precompiler, appends source-site IDs, and injects typed host declarations. This duplicates information
the compiler already has and excludes assertion sites introduced by include resolution.

Add native assertion instructions and compiler-owned source tracking as an additive compiler capability. Existing
project tests continue through their current runner/precompiler. Migration and editor integration are tracked in
[TODO 491](../491-migrate-project-testing-to-native-assertions.md). This concerns assertions in 8f4e programs;
package unit tests continue using Vitest.

## Proposed Solution

### Native instructions and compiler flag

- Add `assert` for a truth condition and `assertEqual` for a received/expected value pair.
- `assert` accepts an integer condition: zero fails, and any nonzero value passes.
- `assertEqual` requires matching operand types and uses exact equality without an implicit floating-point tolerance.
  Pointer operands compare addresses without dereferencing. Approximate comparison must be expressed separately;
  designing an additional approximate assertion instruction is a follow-up concern.
- Add `enableAssertions` to compiler options, defaulting to `false`.
- Recognize both instructions regardless of the flag. Turning assertions off must not reject their presence.
- Keep their stack effects consistent in both modes: `assert` consumes one operand; `assertEqual` consumes two.
- When disabled, emit operand drops without comparisons, assertion callbacks, or assertion imports. Instructions that
  produced the operands still execute, preserving their side effects. Normal syntax and stack validity remain checked.
- When enabled, emit calls to compiler-defined host imports and append compiler-generated site IDs. Callbacks report
  both passes and failures and return normally so later assertions can execute.

### Compiler stage responsibilities

| Stage | Responsibility |
| --- | --- |
| Language specification and tokenizer | Define instruction syntax, placement, and operand rules; parse both instructions in either mode. |
| Program composer | Preserve original source identity through includes, nested groups, and symbol qualification. |
| Semantic resolution and stack analyzer | Resolve operands and record their types and stack effects. |
| Sub-program planning | When enabled, build an assertion plan with site IDs, source lookup, callback signatures, and import indices. |
| Wasm code generation and emission | Generate callback calls or drops and emit the planned import/type sections. |

The flag chiefly affects assertion planning and code generation. Callback imports must be accounted for before final
function indices are assigned: adding imports changes the indices of defined functions, entry dispatchers, and
`initDefaults`. Do not append imports opportunistically while emitting individual instruction bodies.

The compiler owns the import contract: module/field names, parameter types including the site ID, and return types.
Callers supply only the compiler flag during compilation and matching callbacks during Wasm instantiation. The
instruction contracts establish assertion semantics; JavaScript callback implementations and result reporting remain
runtime concerns.

Assertions check the values supplied at the point of execution, whatever the current program state is. The compiler's
assertion system neither initializes nor resets memory, selects test entries, schedules runs, nor requires a fresh
instance. Those policies belong to the test runner and editor runtime.

### Source-site metadata

Return a source-site lookup with the compiled program. Each static assertion should identify its instruction kind,
original project block ID, canonical group path, module/function identity, and zero-based physical block line. Preserve
source provenance for included code as well. Site IDs are scoped to one compiled program; repeated loop invocations
share a site ID and have separate invocation indices.

Return the lookup alongside Wasm bytes when assertions are enabled. The compiler owns static site identity; runtime
invocation indices and compilation/run identity for stale-result handling belong to consumers.

## Implementation Plan

Deliver native instructions, the opt-in flag, typed callback imports, and compiler-owned site metadata as an additive
compiler change. Existing `call assert` instructions remain ordinary function calls through the current runner and
precompiler. This TODO does not migrate project sources, change runner/CLI/editor behavior, or remove the precompiler.

1. Define instruction contracts, `enableAssertions`, compiler-result site metadata, and the callback ABI. Implement
   integer truth conditions, exact equality of matching operand types, and pointer address equality. Specify supported
   numeric/pointer signatures and received/expected ordering.
2. Implement parser/spec and semantic/stack support. Preserve source provenance through composition and includes.
3. Add assertion planning and typed callback imports, accounting for all Wasm function/type indices. Implement enabled
   calls and disabled drops in module and function code generation; expose the site lookup in compiler output.
4. Add focused compiler integration tests that instantiate Wasm with test-supplied callbacks directly. Verify operands,
   site mapping, and callback continuation without changing the production runner or migrating existing fixtures.
5. Document the compiler flag, instruction semantics, callback ABI, and site lookup. This TODO is independently reviewable
   and complete once its compiler criteria pass; runner migration is tracked separately in TODO 491.

## Success Criteria

- [x] Both instructions compile when assertions are disabled, consume operands, and require no assertion imports.
- [x] `assert` accepts integer conditions; `assertEqual` uses exact equality for matching types and pointer addresses.
- [x] Assertions check current operands without imposing memory initialization/reset or test scheduling policies.
- [x] Enabled instructions call the documented imports with their operands and site IDs; compiler output maps IDs to
      original source sites, including nested and included code.
- [x] Direct compiler/Wasm tests verify subsequent assertions execute when a callback records a failure and returns.
- [x] User imports, function indices, entry exports, and existing memory initialization remain correct in both modes.
- [x] Existing `call assert` sources, runner/precompiler behavior, and CLI/editor behavior remain supported unchanged.
- [x] Compiler instruction, flag, callback ABI, and result metadata documentation is updated.

## Validation Checkpoints

- Run Nx tests/typechecks/builds for changed compiler stages and `@8f4e/compiler`.
- Test enabled/disabled assertions in modules and functions, mixed user imports, nested groups, resolved includes,
  branches, loops, and all supported operand types. Inspect emitted Wasm imports in both modes.
- Verify source-site lines for comments and continued source lines without rewriting the original project.
- Cover zero/nonzero integer conditions, matching/mismatched types, pointer address equality, exact float comparisons,
  NaN, infinities, and failure continuation using callbacks supplied directly by compiler tests. Verify native equality
  does not apply an implicit tolerance while legacy runner comparisons retain their existing behavior.
- Run existing compiler fixture and runner/CLI regression suites without migrating their assertion sources.

## Affected Components

- `packages/compiler/packages/language-spec/` - Instruction, option, source-site, and result contracts.
- `packages/compiler/packages/program-composer/` - Original source and group provenance.
- `packages/compiler/packages/sub-program/` - Assertion planning and semantic/stack passes.
- `packages/compiler/packages/wasm-codegen/` - Assertion bodies, imports, and binary emission.
- `packages/compiler/src/` and `packages/compiler/tests/` - Public results, fixtures, and integration coverage.
- Compiler instruction and API documentation.

## Risks & Considerations

- **Typed ABI remains to be specified:** define callback names/signatures and conversions for integer, float32,
  float64, and supported pointer operands without losing information or relying on ambiguous overloads.
- **Ignored assertions still consume operands:** removing the source instruction outright would leave stack values
  behind. Operand-producing instructions remain active even when assertions are disabled.
- **Imports are required when emitted:** disabled programs emit none; enabled programs need matching callbacks on every
  instantiation path. Callback implementations are runtime concerns rather than compiler configuration.
- **Source identity must survive composition:** qualified names alone are insufficient for locating original editor
  lines, especially in nested groups and included sources. Compilation identity prevents reuse of stale site IDs.
- **Additive compatibility:** ordinary `call assert` remains a normal user-function call. Native assertion import
  planning must coexist with user imports and must not activate or alter the existing runner/precompiler path.
- **Equality semantics:** native `assertEqual` is exact; existing runner comparisons retain their `0.001` tolerance
  until the separately tracked migration. Document the distinction without changing existing fixtures.

## Related Items

- **Blocks:** [TODO 491: Migrate project testing to native assertions](../491-migrate-project-testing-to-native-assertions.md).
- [TODO 455: Unify assert and assertf with polymorphic overloads](455-unify-assert-and-assertf-with-polymorphic-overloads.md).
- [TODO 438: Add generic function imports](438-add-generic-function-imports.md).
- [TODO 437: Add execution entries](437-add-execution-groups.md).

## References

- [Compiler sub-program orchestration](../../../packages/compiler/packages/sub-program/src/compileSubProgram.ts).
- [Wasm emission](../../../packages/compiler/packages/wasm-codegen/src/emitWasmProgram.ts).

## Notes

Completed on 2026-10-09. Native assertions are opt-in, retain their stack effects when disabled, and use only the
needed typed host imports when enabled. Compiler output includes original block/group/line identity, include
provenance, and qualified signature-derived function IDs. Existing runner sources and fixture snapshots were retained.

Validation passed for tests and standard package typechecks across language-spec, tokenizer, program-composer,
stack-analyzer, wasm-codegen, sub-program, compiler, test-runner, and CLI; affected compiler lint targets also passed.
Added 16 compiler/Wasm integration cases, six parser syntax cases, and a sub-program global-index regression case.

The expanded compiler test typecheck (`tsconfig.test.json`) still reports six pre-existing errors in
`src/diagnostic.test.ts` and `src/project-api.test.ts`; none are in the new assertion tests. Fresh dependency builds
were completed before running suites to avoid a test/build output race.


Recorded on 2026-10-09 from the testing/runtime design discussion. Exact equality, matching operand types, integer
truth conditions, and pointer address comparison are settled. The callback ABI is documented in the compiler testing reference. Memory/reset policy and execution timing belong to the runner/runtime, not compiler assertions.

This TODO can be completed independently once compiler support and its tests/documentation are finished. Runner,
fixture, CLI, and editor migration and precompiler removal belong to TODO 491.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
