# Batch Module Processing Shape

This note captures a possible future direction for module processing in the compiler.

## Summary

The current compiler parses modules individually and only later reasons about them as a batch.

That keeps `compileToAST(...)` simple and local, but it also means some cross-module concerns have to be handled in separate orchestration steps after parsing. A future batch-oriented module-processing pass could simplify those responsibilities and make ownership boundaries more obvious.

This is not a commitment to rewrite the parser into hidden shared mutable state. The cleaner direction would be a batch entry point that still uses the existing per-module parser internally.

## Current Shape

Today the pipeline effectively does this:

1. parse each module independently into an AST
2. run batch-level checks such as duplicate module id validation
3. sort modules by dependency
4. collect namespaces and layout information
5. normalize/compile using partial and then fuller cross-module knowledge

That works, but some logic exists only because shared module knowledge appears relatively late.

## What Could Become Simpler

### Duplicate module id validation

This is the most obvious case.

If module parsing had a batch-level entry point that tracked top-level ids while building the AST list, duplicate module ids could be rejected immediately at the batch source-to-AST boundary instead of by a separate precheck.

### Intermodule deferral logic

Some normalization paths currently need to distinguish:

- target module not known yet
- target module known but not laid out yet
- target module known and fully resolved

A batch-oriented module pass could collect all top-level module identities and declarations earlier, which would reduce the amount of phase-by-phase uncertainty and deferral logic.

### Namespace and layout staging

Namespace collection currently has to do iterative/deferred work because cross-module references may appear before the full module set is known.

A batch-oriented shape could make the stages more explicit:

1. collect module headers and namespace-bearing declarations
2. collect dependency and intermodule reference information
3. compute memory/layout order
4. run normalization with a complete module registry

That would be easier to reason about than partial-state signaling through shared structures.

### Clearer distinction between importable namespaces and real modules

The compiler currently supports both constants blocks and modules under a shared namespace concept.

That is valid, but it means some downstream code has to ask not just “does this namespace exist?” but “is this actually a module?”. A stronger batch pass could make that distinction explicit earlier and reduce the need for later guards.

### Cleaner graph optimizer boundary

The graph optimizer should just order already-validated modules by dependency.

If the module batch were validated and annotated earlier, the optimizer could become a pure ordering step over prepared module metadata rather than raw ASTs plus inferred assumptions.

### Better shared intermediate metadata

Instead of rediscovering facts from AST lines in multiple phases, a batch pass could build a module table once, for example:

- module id
- block kind
- imported namespaces
- constants
- memory declarations
- intermodule references
- layout dependencies

Then later phases could consume that metadata directly rather than re-reading raw AST structure repeatedly.

### Clearer ownership of cross-module errors

A batch module-processing layer is also a more natural home for cross-module diagnostics such as:

- duplicate module ids
- invalid intermodule targets
- ambiguous namespace-kind assumptions
- possibly explicit dependency-cycle diagnostics, if desired later

## What Should Probably Not Change

### Keep the single-module parser pure

The low-level parser should probably remain “one source block in, one AST out”.

The desirable future direction is not implicit parser-global shared state. It is an explicit batch helper above the single-module parser, something in the spirit of:

```ts
parseModulesToAsts(modules)
```

That preserves local parser testability and reuse while still giving the compiler a coherent batch boundary.

### Avoid turning this into a full tokenizer redesign

The main value here is better ownership of cross-module concerns, not a wholesale rewrite of syntax parsing.

## Why This Was Deferred

This direction came up while tightening duplicate module-id handling.

It looked cleaner architecturally, but it was larger than the current task and would have been easy to over-expand in the same context. The immediate fix was to keep the current overall pipeline and improve ownership incrementally.

So this note exists to preserve the broader idea for a later, fresh refactor context.
