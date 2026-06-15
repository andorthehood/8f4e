# Decouple Constants From Memory

Date: 2026-06-15

This note captures one narrow compiler cleanup: decoupling constants from memory.

## Short Version

Resolve constants in a single constant-only pass that has no access to memory.

`const` values should be allowed to reference only numeric literals and already-resolved constants through the supported compile-time expression syntax. They should not be able to resolve memory metadata queries or memory addresses.

This is intentionally narrower than decoupling module execution order from memory layout. The scope here is only decoupling constants from memory.

## Motivation

The current compiler can resolve constants from memory-derived forms, such as a constant whose value is `sizeof(buffer)`, `count(buffer)`, or `&buffer`.

That creates feedback between constant resolution and memory planning:

- constants may need memory declarations to exist
- memory declarations may use constants for sizes/defaults
- layout-sensitive constants may need memory addresses after planning

Constants should be simpler: resolve constants once without consulting memory, then use those resolved constants wherever later compiler phases need them. Avoid repeated passes where constants and memory metadata take turns becoming available.

## Design Criteria

- Constant resolution must be independent from `context.namespace.memory`.
- Constant resolution must not need module byte addresses, memory item byte addresses, element sizes, element counts, min/max metadata, or pointer provenance.
- Do not add a special explicit deny-list for memory forms in `const`.
- In particular, do not add bespoke checks like "metadata queries are forbidden in constants" for `sizeof(...)`, `count(...)`, `min(...)`, `max(...)`, `&name`, or `name&`.
- Instead, make the constant resolver simply not know how to resolve those forms.
- If such a form appears in a `const` value, it should fail through the normal unresolved constant/value path: it did not match a literal, known constant, or constant-only expression operand.
- The error can be the existing unresolved identifier / unresolved const-expression style error, unless that error becomes misleading after the implementation.
- Existing use of memory metadata outside `const` can remain supported for now, such as `push sizeof(buffer)` or direct memory declaration operands, unless a later cleanup targets those separately.

## Intended Boundary

`const` normalization should use a constant-only compile-time resolver.

Allowed operands:

- numeric literals
- previously resolved constants
- one-operator expressions whose operands are themselves allowed constant-only operands

Not part of the constant resolver's world:

- local memory start/end references: `&name`, `name&`
- intermodule memory references: `&module:name`, `module:name&`
- module base/end references
- metadata queries: `sizeof(...)`, `count(...)`, `min(...)`, `max(...)`
- pointee metadata queries: `sizeof(*name)`, `count(*name)`, `min(*name)`, `max(*name)`
- any equivalent intermodule metadata query

The tokenizer may still classify those operands structurally. The key is that the constant-resolution phase should not interpret them.

## Migration Shape

1. Clean source examples that cache memory metadata in constants.
2. Add focused compiler tests for rejected memory-dependent constants.
3. Refactor `const` normalization to call a constant-only resolver.
4. Keep general compile-time argument normalization for memory declarations, `push`, `map`, `default`, and memory instructions separate from constant-only resolution.
5. Update docs so `const` examples describe only literal/constant-based expressions.
6. Remove or rewrite tests whose only purpose was proving `const FOO sizeof(bar)` works.

## Current Repository Usage

An audit on 2026-06-15 found this usage to be small:

- no `const FOO &bar` style address constants in `.8f4e` / `.8f4em` source
- a small number of `const` declarations using `sizeof(...)` or `count(...)`
- real example-project usage was the repeated idiom `const SIZE sizeof(*buffer)`, which can be rewritten as direct `push sizeof(*buffer)`

## Non-Goals

- Do not solve full module execution order vs memory layout decoupling here.
- Do not remove direct `push sizeof(...)` / `push count(...)` support in this step.
- Do not remove memory metadata queries from array sizes or scalar defaults in this step unless a later design decides to.
- Do not redesign pointer/default/address wiring in this step.
