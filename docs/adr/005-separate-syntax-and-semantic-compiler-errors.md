# ADR-005: Separate Syntax and Semantic Compiler Errors

**Date**: 2026-03-16

**Status**: Accepted

## Context

The compiler has two distinct phases that detect different classes of failures:

1. **Syntax validation** checks whether tokens, instruction shapes, and argument forms are structurally valid before semantic context exists.
2. **Semantic compilation** checks whether otherwise valid syntax can be compiled within the current symbol table, scope, stack state, and type environment.

These failures have different inputs, different ownership, and different remediation paths. Mixing them into a single error system would blur where errors should be raised, make compiler code harder to reason about, and increase the chance of phase-order bugs where semantic logic is used to report what should have been caught by syntax validation.

The repository already encodes this distinction in:

- `packages/compiler/src/syntax/syntaxError.ts`
- `packages/compiler/src/compilerError.ts`
- repository guidance in `AGENTS.md`

## Decision

We maintain **two separate compiler error domains**:

1. **Syntax errors**
   - Owned by the syntax layer
   - Raised when the problem is detectable from token or argument shape alone
   - Implemented with `SyntaxRulesError` and `SyntaxErrorCode`

2. **Semantic/compiler errors**
   - Owned by the compiler layer
   - Raised when detection requires symbol resolution, scope, stack state, memory rules, or type checking
   - Implemented with `getError` and `ErrorCode`

The decision rule is:

- If the error can be detected before semantic context is built, it is a syntax error.
- If the error requires compiler state or semantic reasoning, it is a compiler error.

Default messages remain owned by the central registry for each error domain. Throw sites should not duplicate default message text unless dynamic context is required.

## Consequences

### Positive

1. **Clear ownership by phase**: Contributors can determine where an error belongs by asking when it becomes knowable.
2. **Cleaner compiler boundaries**: Syntax helpers remain lightweight and reusable without depending on full compiler state.
3. **More maintainable diagnostics**: Error codes and default messages are managed in the layer that owns the rule.
4. **Lower risk of phase leakage**: Syntax validation does not accidentally depend on semantic data structures.
5. **Better tooling support**: Syntax-only consumers can surface syntax diagnostics without pulling in semantic compilation.

### Negative

1. **Requires discipline**: Contributors must choose the correct error domain when adding new validation rules.
2. **Some rules need careful classification**: Borderline cases must be judged by detection phase, not by perceived severity.
3. **Two registries to maintain**: New contributors must learn both error systems.

## Alternatives Considered

### 1. Single Unified Compiler Error Type

Rejected because it would hide the distinction between pre-semantic and semantic failures and make error ownership less explicit.

### 2. Classify Errors by Feature Area Instead of Phase

Rejected because feature-based grouping does not answer the key architectural question: at what point in the pipeline is the error knowable?

### 3. Defer Most Validation to Semantic Compilation

Rejected because it would make lightweight parsing and tooling less useful, and would couple early validation to compiler internals.

## Related Decisions

- [ADR-008: Provide a Syntax-Only Compiler Entry Point for Tooling](008-provide-a-syntax-only-compiler-entry-point-for-tooling.md)

