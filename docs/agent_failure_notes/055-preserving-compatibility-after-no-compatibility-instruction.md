---
title: Agent Failure Note - Preserving compatibility after no-compatibility instruction
agent: Codex App
model: GPT-5
date: 2026-05-26
---

# Agent Failure Note - Preserving compatibility after no-compatibility instruction

## Short Summary

The agent preserved old `includeAST` runtime behavior while refactoring `AST` into a stricter typed object interface. This directly contradicted repeated user guidance that the project is unreleased and compatibility layers or old semantics should not be kept.

## Original Problem

The compiler AST refactor changed `AST` from a raw `CompilerASTLine[]` into typed source-block objects such as `ModuleAST`, `FunctionAST`, and `ConstantsAST`. The intended goal was an honest, stricter interface where typed metadata and `lines` describe the same parsed representation.

Before the refactor, compiled outputs exposed `ast` as a normalized line array:

```ts
ast: normalizedAst
```

During the refactor, the agent tried to preserve that old behavior by returning the new typed AST object while replacing only its `lines` field:

```ts
ast: {
	...ast,
	lines: normalizedLines,
}
```

That created a hybrid object: metadata such as `moduleLine`, `memoryDeclarationLines`, `functionLine`, `functionEndLine`, `signature`, or `exportLine` still described the original parsed AST, while `lines` described the normalized compilation lines.

## Anti-Patterns

- Preserving old runtime behavior just because it existed before the refactor.
- Treating compatibility as an implicit default even after the user explicitly said not to keep compatibility layers.
- Updating a type interface while silently retaining old semantic behavior under the new type.
- Returning a hybrid object whose fields describe different compiler representations.
- Optimizing for fewer downstream changes instead of an honest new contract.
- Failing to ask the design question: should compiled output expose parsed AST, normalized AST, or a separately typed normalized representation?

This was especially bad because the user had repeatedly stated that the project is unreleased and that callers, tests, fixtures, and snapshots should be updated directly rather than preserving old APIs or behavior.

## Concrete Risks

- Callers may assume `compiledModule.ast.lines` and `compiledModule.ast.memoryDeclarationLines` refer to the same representation when they do not.
- A future agent may read the type as trustworthy and build more logic on top of stale metadata.
- Tests may pass while the public compiler result contains an incoherent AST object.
- The stricter AST interface becomes less meaningful because runtime values can violate the conceptual contract.
- Compatibility preservation hides the actual design decision from review.

## Failure Pattern

Preserving old semantics under a stricter type interface after explicit instructions to remove compatibility behavior.

## Correct Solution

Make the compiler result contract honest instead of compatible. If `compiledModule.ast` and `compiledFunction.ast` use `ModuleAST`, `ConstantsAST`, or `FunctionAST`, they should return the original parsed AST object whose metadata and `lines` agree.

Normalized lines should remain internal to compilation unless the project intentionally introduces a separate first-class type for them. If normalized output is needed later, design and name it explicitly rather than smuggling it through the parsed AST type.

When the user has explicitly said not to preserve compatibility, do not carry old behavior forward silently. Update call sites, tests, snapshots, and docs to the new contract.
