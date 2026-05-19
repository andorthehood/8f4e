---
title: 'TODO: Avoid AST cache hashing when no cache entry exists'
priority: Medium
effort: 1-2h
created: 2026-05-19
status: Open
completed: null
---

# TODO: Avoid AST cache hashing when no cache entry exists

## Problem Description

`compileToAST` computes `hashSource(...)` before it knows whether a cache entry exists for the supplied key. In normal one-shot compiler runs, or on first parse for a key, that means every source block is fully hashed even though there is no entry to compare against.

The compiler coverage metrics showed `hashSource` as one of the hottest tokenizer functions by range executions.

## Proposed Solution

Check for an existing cache entry before hashing. If there is no entry for the key, skip hashing until after parsing, or store the parsed AST with a hash only when a future comparison will need it.

Consider whether fresh non-incremental compiler runs should bypass AST cache hashing entirely.

## Success Criteria

- [ ] `compileToAST` avoids hashing source when no cache entry exists.
- [ ] Incremental/editor cache hits still validate source changes correctly.
- [ ] Compiler coverage logs show reduced tokenizer `rangeExecutions` for unchanged benchmark behavior.

## Affected Components

- `packages/compiler/packages/tokenizer/src/parser.ts`
- `packages/compiler/packages/tokenizer/src/cache/hashSource.ts`

