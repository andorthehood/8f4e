# Centralize Project Directive Parsing

This note captures a likely architectural direction for runtime/project directives such as `; ~sampleRate ...`.

## Problem

The current `runtimeDirectivesEffect` scans all code blocks and all lines again to resolve runtime directives.

That is workable for one directive, but it is a poor long-term shape:

- multiple features already walk the same code blocks independently
- runtime directives are likely to grow beyond `~sampleRate`
- repeated full-project scans fragment parsing logic across effects
- different features can subscribe to different state paths and become inconsistent
- error attribution is harder when each feature invents its own block/line mapping

This is especially awkward because the editor already has central-ish passes that iterate project code to derive block type, rendering data, errors, and widgets.

## Better Direction

Move toward a shared project/code-block parse pass that scans blocks and lines once, then exposes parsed records to feature-specific resolvers.

For runtime directives, that means:

1. A central pass walks code blocks in project order.
2. It identifies directive comment lines once.
3. It emits structured records such as:
   - block id
   - block creationIndex
   - raw row
   - directive namespace/prefix (`@` vs `~`)
   - directive name
   - args
4. Feature-specific logic resolves meaning from those parsed records.

So the split becomes:

- parsing is centralized
- resolution remains feature-owned

## Why This Is Better

- avoids repeated full-project rescans
- keeps project order semantics consistent
- makes block/line error mapping reliable
- makes `@...` and `~...` directives easier to extend
- reduces the risk that one feature updates on `selectedCodeBlock.code` while another only reacts to `graphicHelper.codeBlocks`

## Suggested Shape

Not a generic plugin system at first.
Prefer a concrete derived-data layer.

Possible shape:

- one source-analysis pass over `graphicHelper.codeBlocks`
- parsed comment/directive records are collected into derived project metadata
- editor directives and runtime directives consume that metadata
- runtime directive resolver only resolves already-parsed `~...` records

Example output data:

```ts
type ParsedProjectDirective = {
  blockId: string;
  creationIndex: number;
  rawRow: number;
  prefix: '@' | '~';
  name: string;
  args: string[];
};
```

Then:

- editor directive features consume parsed `@...` records
- runtime directive resolution consumes parsed `~...` records

## Good First Step

The first implementation step should be small and structural:

1. Extend the main code-block update / graphics derivation pass to scan each block's lines once.
2. Parse comment directives generically for both:
   - `; @...`
   - `; ~...`
3. Store lightweight parsed directive records on each `CodeBlockGraphicData` object.

Suggested shape:

```ts
parsedDirectives: Array<{
  prefix: '@' | '~';
  name: string;
  args: string[];
  rawRow: number;
}>
```

Important boundary:

- store parsed directive records first
- do not store fully resolved runtime/editor meaning on the block yet

That keeps the first step low-risk and lets existing features migrate gradually.

The intended migration path is:

1. add `parsedDirectives`
2. populate it in the central block update pass
3. switch `runtimeDirectivesEffect` to consume `parsedDirectives` instead of rescanning raw code
4. later migrate editor directive features one by one

## Non-Goals

- Do not build a large abstract hook framework before there is proven need.
- Do not merge editor-only directive semantics with runtime/project directive semantics.
- Do not make each feature responsible for rescanning raw source forever.

## Near-Term Implication

If runtime directives are going to replace legacy stack-config project config, they should probably sit on top of a first-class project source analysis layer rather than a standalone effect that loops through every block independently.

That would make future directives such as `~runtime` easier to add and easier to validate.
