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

## Implementation Plan

### Step 1: Tighten the compile-time expression node shape

- Define the intended operand structure for `ArgumentType.COMPILE_TIME_EXPRESSION`
- Ensure the node stores parsed operand arguments rather than raw token fragments

### Step 2: Reuse parser-owned identifier/query classification inside expressions

- Feed already-classified identifier/query arguments into compile-time expression operands
- Avoid keeping raw `sizeof(...)` / `count(...)` / address-like strings as opaque expression operands

### Step 3: Remove compiler-side expression syntax reconstruction

- Update semantic compile-time folding to consume the structured expression node directly
- Delete any remaining expression-specific string parsing that only exists because operands are under-structured

## Success Criteria

- Compile-time expression AST nodes contain structured operand arguments.
- Metadata-query and classified identifier operands inside expressions are already parsed by `@8f4e/ast-parser`.
- Compiler semantic folding consumes AST structure directly instead of reparsing expression operands from strings.

## Related Items

- Depends on: 336 `Move identifier reference classification into ast-parser`
- Related: 337 `Add structured address and query extraction to ast-parser`

## Notes

This is the next parser-boundary cleanup after moving identifier/reference classification into `@8f4e/ast-parser`.
It keeps compile-time expression syntax as a real AST tree instead of a partially structured container around token strings.
