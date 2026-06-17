# Immutable Compiler Pass Reports

Date: 2026-06-17

This note captures a compiler architecture direction: after the tokenizer returns an AST, later compiler passes should
not mutate it or return rewritten ASTs. They should return separate report objects containing the new facts they
discover.

## Short Version

The tokenizer/parser may mutate while constructing the AST because it owns AST creation.

After that boundary, the AST should be treated as source-shaped input. Compiler passes should produce separate,
explicit reports keyed back to the AST.

Examples:

- constant resolution returns constant value facts, not an AST with replaced arguments;
- memory planning returns layout facts, not rewritten declarations;
- memory default resolution returns default and pointer facts, not enriched declarations;
- semantic reference resolution returns line/argument facts, not resolved line objects;
- stack analysis returns stack/call/local facts, not mutated analyzed AST lines;
- codegen consumes the AST plus reports and emits backend output.

## Motivation

Compiler passes become easier to reason about when they have a single role:

- read the AST and prior reports;
- compute their own facts;
- return those facts as a named report.

This avoids hidden coupling where one pass silently changes objects that another pass later observes. It also makes the
compiler pipeline easier to inspect, test, and eventually cache because every derived fact has an owner.

A refactor is only complete when the consumer side is updated too. The downstream compiler pass or backend should read
the new report shape directly, not through an adapter that rebuilds the old mutated/enriched object surface.

## Boundary Rule

Allowed mutation:

- tokenizer/parser internals while constructing the AST;
- per-pass local context objects used only during that pass;
- backend emission state such as bytecode buffers inside codegen.

Not allowed after tokenizer output:

- mutating AST lines, AST arguments, or AST arrays;
- attaching semantic facts directly to AST line objects;
- returning a rewritten AST from an analysis/resolution pass;
- mutating shared metadata objects such as function metadata to communicate pass results.

The desired shape is:

```ts
const ast = parseProject(...);
const constants = resolveConstants({ ast });
const memoryPlan = planProjectMemoryLayout({ ast, constants });
const memoryDefaults = resolveMemoryDefaults({ ast, memoryPlan, constants });
const semanticReferences = resolveSemanticReferences({ ast, constants, memoryPlan, memoryDefaults, functions });
const stackAnalysis = analyzeStack({ ast, semanticReferences, memoryPlan });
const wasm = generateWasm({ ast, memoryPlan, memoryDefaults, semanticReferences, stackAnalysis });
```

## Report Shape

Reports should use stable keys rather than object identity:

- project/module/function ids for top-level maps;
- line index or source line number for line facts;
- argument index for argument facts;
- function id for call target and reachability facts;
- module id plus memory id for layout/default/pointer facts.

When line numbers are not unique enough, prefer block id plus line index. Reports can still include source line numbers
for diagnostics and debugging.

## Compatibility Policy

Do not add compatibility shims, transitional re-exports, fallback fields, or old API adapters while doing this work.

The software has not been released, so internal and external compiler package contracts may break. The goal is to
finish each boundary in its desired final shape, not preserve temporary compatibility layers.

That includes consumers. When a producer pass changes from mutation to reports, update all downstream consumers in the
same refactor so they consume the report contract directly.

## First Concrete Target

The stack analyzer is the next best target because it is an analysis pass that still communicates some results through
mutated objects:

- resolved calls get `targetFunction` attached to analyzed line objects;
- called functions are marked through `FunctionMetadata.used = true`;
- pointer metadata can be enriched through mutable local binding objects.

That work is tracked separately in `docs/todos/463-refactor-stack-analyzer-to-return-fact-report.md`.

## Non-Goals

- Do not rewrite tokenizer construction just to avoid internal parser mutation.
- Do not remove per-pass local mutable context where it is purely internal.
- Do not force codegen emission state to be immutable.
- Do not add adapters that keep old pass return shapes alive.
