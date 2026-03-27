---
title: 'TODO: Add instruction classification metadata to AST lines'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# 339 - Add instruction classification metadata to AST lines

## Summary

The parser already assigns some syntax-level line metadata such as `isSemanticOnly`, but the compiler still relies on repeated instruction-name checks and local string sets to decide what role a parsed line has.

That means syntax-level facts about instructions are still being rediscovered in compiler code instead of being emitted by `@8f4e/ast-parser`.

## Goal

Make the AST line objects carry richer instruction classification metadata so semantic and codegen layers can route lines based on parser-owned classification instead of repeated instruction-name matching.

## Problem Description

Several instruction properties can be determined entirely from syntax and instruction identity, for example:

- whether an instruction is semantic-only
- whether it is a memory declaration
- whether it starts a block
- whether it ends a block
- whether it introduces named declarations
- whether it is only valid in certain structural scopes

Today those facts are still partly encoded in compiler-side string lists and helper logic.

## Proposed Solution

Extend AST line objects with parser-owned classification metadata derived from instruction name and syntax shape.

Possible metadata includes:

- `isSemanticOnly`
- `isMemoryDeclaration`
- `isBlockStart`
- `isBlockEnd`
- `isDeclarationLike`
- `allowedScopes`

The exact field set can stay modest at first. The goal is to stop rediscovering syntax-level instruction categories in the compiler.

## Implementation Plan

### Step 1: Inventory syntax-only instruction categories

- Identify which compiler-side instruction classifications are currently based only on instruction name/shape
- Separate those from truly semantic checks

### Step 2: Emit parser-owned line classification metadata

- Add the chosen classification fields to AST line objects in `@8f4e/ast-parser`
- Populate them during AST generation

### Step 3: Replace compiler-side instruction-name routing where possible

- Update semantic/codegen routing to use AST metadata instead of repeated instruction-name lists
- Keep only semantic validation in compiler

## Success Criteria

- AST lines carry explicit instruction classification metadata for syntax-level categories.
- Compiler routing uses parser-owned metadata where classification is syntax-only.
- Repeated instruction-name string sets in compiler are reduced or removed.

## Related Items

- Related: 336 `Move identifier reference classification into ast-parser`
- Related: 337 `Add structured address and query extraction to ast-parser`
- Related: 338 `Add richer compile-time expression AST nodes`

## Notes

This is the line-level counterpart to identifier/reference classification work.
It keeps the parser/compiler boundary consistent: parser classifies syntax, compiler resolves semantics.
