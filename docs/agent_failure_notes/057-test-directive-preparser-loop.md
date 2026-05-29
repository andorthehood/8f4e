---
title: Agent Failure Note - Test directive preparser loop
agent: Codex App Version 26.519.81530 (3178)
model: GPT-5.5 (high)
date: 2026-05-29
---

# Agent Failure Note - Test directive preparser loop

## Short Summary

The agent tried to fix `#test` directive detection by adding and refining a special raw-text parsing path for that single instruction. That duplicated tokenizer responsibility and turned automated review comments about missed syntax cases into a loop of copying tokenizer behavior instead of using the normal tokenization pipeline.

## Original Problem

The `#test` directive marks module blocks that should be excluded from normal `cycle` execution and included in the test runner. A helper that classified project blocks before compilation checked raw source lines directly:

```ts
return block.code.some(line => instructionParser.exec(line)?.[1] === '#test');
```

Automated review comments pointed out that this raw-text detection missed cases the real tokenizer already understands, such as semicolon comments after the directive.

The agent accepted those comments as local parser bugs and started making the pre-tokenization detector smarter. It then proposed adding an exported helper that reused tokenization logic just to read the first token for this one directive. This made `#test` look architecturally special and kept the duplicate detection path alive.

## Anti-Patterns

- Treating a review bot's local symptom as the full problem.
- Adding a special parser or tokenizer-adjacent helper for a single instruction.
- Copying or exposing tokenizer behavior to make pre-parsing handle comments, whitespace, and edge cases.
- Letting a convenience pre-scan become a second definition of language semantics.
- Trying to satisfy automated review comments by patching every missing case they mention.
- Continuing to improve the wrong abstraction after the user pointed out that normal instructions do not need this treatment.

```ts
// wrong direction: make raw-text test detection increasingly tokenizer-like
return block.code.some(line => line.trimStart().startsWith('#') && getInstructionKeyword(line) === '#test');
```

This still answers "is this a test module?" before the module has gone through the normal source pipeline. It reduces one bug while preserving the architectural problem: `#test` is now understood both by AST construction and by a separate project-level scan.

## Failure Pattern

Patching a duplicated parser path until it resembles the canonical parser, instead of deleting the duplicate path and relying on the canonical parser's output.

## Correct Solution

Filter test modules after tokenization and AST construction.

The tokenizer/compiler path already knows how to parse directives, handle semicolon comments, validate directive arguments, enforce directive placement, and record module metadata. The compiler should classify test modules from that metadata:

```ts
ast.type === 'module' && ast.testLine !== undefined
```

Any behavior that needs to know whether a module is a test module should either:

- run through the normal compile/tokenize-to-AST path and inspect `testLine`, or
- consume metadata produced by that path, such as a compiler result field for discovered test modules.

For the CLI, "No tests found" should come from compiler-produced test metadata, not a raw project-block scan. For editor import behavior, skipping test modules should also be based on parsed AST classification rather than a regex or one-off directive detector.

The lesson is: when a language feature already has a canonical parser, do not create a smaller parser to answer a routing question. Move the routing decision later, or expose parser-owned metadata.
