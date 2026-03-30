---
title: 'TODO: Add richer compile-time expression AST nodes'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# 338 - Add richer compile-time expression AST nodes

## Summary

The parser already emits compile-time expression nodes for supported binary forms such as:

- `SIZE*2`
- `123*sizeof(foo)`

But those expression nodes are still not as structured as they could be. The compiler still depends on partially string-shaped operands and follow-up syntax reconstruction instead of receiving a fully parsed expression tree composed of already-classified AST arguments.

## Goal

Make compile-time expressions in the AST fully structured, so each operand is already represented as a parsed argument node rather than an under-classified token string.

This is still a tokenizer/AST-contract refactor. It is not a semantic-resolution refactor.

## Problem Description

Compile-time expressions are already distinct from plain identifiers, but the AST model is still weaker than it should be:

- operand nodes are not yet consistently enriched with parser-owned reference classification
- nested syntax forms inside expressions such as `sizeof(foo)` still require downstream interpretation
- the expression node is not yet the single syntax truth for compile-time expressions

This keeps syntax rediscovery alive in the compiler and weakens the parser/compiler boundary.

## Proposed Solution

Represent compile-time expressions as explicit syntax trees where:

- the expression node owns the operator
- the left operand is a parsed AST argument node
- the right operand is a parsed AST argument node
- metadata queries and classified identifiers inside operands are already structured by the parser

For example, `123*sizeof(foo)` should be represented as:

- compile-time expression
- operator: `*`
- left: literal `123`
- right: identifier argument already classified as `element-word-size` with extracted target information

## Scope

This TODO covers:

- richer tokenizer-owned AST node structure for compile-time expressions
- explicit structured operands for literals, identifiers, and query/address-derived identifier forms already handled by earlier todos
- updating compiler consumers to read the richer expression shape directly

This TODO does not cover:

- moving semantic name/value resolution into tokenizer
- adding new runtime validation in semantic or codegen
- expanding the language into a general-purpose expression system beyond the currently supported compile-time expression forms
- keeping both the old thin expression shape and the richer replacement active in production as a permanent mixed model

## Start Here

Start from these files:

- `packages/tokenizer/src/syntax/parseArgument.ts`
- `packages/tokenizer/src/types.ts`
- `packages/compiler/src/semantic/resolveCompileTimeArgument.ts`
- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/src/semantic/normalization/helpers.ts`

Read them together before changing the AST shape so the new node design is driven by actual compiler consumers, not just tokenizer convenience.

## Anti-Patterns

- Do not move semantic resolution into tokenizer.
- Do not add semantic/codegen runtime guards for syntax that tokenizer already owns.
- Do not leave both the old and new expression representations active in production code longer than necessary.
- Do not just bolt more optional fields onto the current node if compiler still has to infer structure ad hoc.
- Do not mark this todo complete while compiler production code still needs to re-infer expression sub-shape from raw operand values.

## Implementation Plan

### Step 1: Tighten the compile-time expression node shape

- Define the intended operand structure for `ArgumentType.COMPILE_TIME_EXPRESSION`
- Ensure the node stores parsed operand arguments rather than raw token fragments
- Make the target shape clearer from types alone than the current thin `lhs/operator/rhs` wrapper

### Step 1.5: Inventory compiler expression consumers

- Identify which production compiler paths still branch on expression internals
- Separate parsed-syntax concerns from semantic-resolution concerns before changing the node shape

### Step 2: Reuse parser-owned identifier/query classification inside expressions

- Feed already-classified identifier/query arguments into compile-time expression operands
- Avoid keeping raw `sizeof(...)` / `count(...)` / address-like strings as opaque expression operands

### Step 3: Remove compiler-side expression syntax reconstruction

- Update semantic compile-time folding to consume the structured expression node directly
- Delete any remaining expression-specific string parsing that only exists because operands are under-structured

### Step 4: Remove obsolete thin-shape assumptions

- Rewrite remaining production compiler branches that still assume the old expression wrapper is the primary contract
- Do not treat partial migration as done while production compiler code still depends on the old thin representation

## Validation Checkpoints

- `rg -n "COMPILE_TIME_EXPRESSION" packages/compiler/src packages/tokenizer/src -g '!**/dist/**'`
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache`

## Success Criteria

- Compile-time expression AST nodes contain structured operand arguments.
- Metadata-query and classified identifier operands inside expressions are already parsed by `@8f4e/tokenizer`.
- Compiler semantic folding consumes AST structure directly instead of reparsing expression operands from strings.
- Compiler production code no longer needs to re-infer expression sub-shape from raw operand values.
- Semantic/codegen layers do not add new runtime syntax validation for tokenizer-owned expression syntax.
- This TODO is not complete while production compiler code still depends on the old thin expression representation as the primary contract.

## Related Items

- Depends on: 336 `Move identifier reference classification into tokenizer`
- Related: 337 `Add structured address and query extraction to tokenizer`

## Notes

This is the next parser-boundary cleanup after moving identifier/reference classification into `@8f4e/tokenizer`.
It keeps compile-time expression syntax as a real AST tree instead of a partially structured container around token strings.
