---
title: Agent Failure Note – Editor Directives Documented in Compiler Package
agent: GitHub Copilot Agent
model: Claude Sonnet 4.5
date: 2026-02-09
---

# Agent Failure Note – Editor Directives Documented in Compiler Package

## Short Summary

The agent placed comprehensive editor directive documentation in the compiler docs package, violating the separation of concerns between compiler (language processing) and editor (UI/tooling) functionality.

## Original Problem

The agent was asked to migrate editor directives from hash-prefixed format (`# debug`) to semicolon-comment format (`; @debug`) and document the new format. 

The agent created a file `packages/compiler/docs/comments-and-editor-directives.md` that combined:
- Compiler comment syntax (appropriate for compiler docs)
- Editor directive documentation (inappropriate for compiler docs)

The user correctly identified this as problematic: "Please remove the mention of editor directives from the compiler docs as they're irrelevant from the point of the compiler."

## Incorrect Fix Attempted (Anti-Pattern)

The agent combined two distinct concerns into a single documentation file in the compiler package:
1. Language-level features (comment syntax that the compiler understands)
2. Editor-specific features (directives that only the editor UI parses)

This violates the principle that each package should only document features within its domain. The compiler treats editor directives as plain comments and has no knowledge of their special meaning to the editor.

## Failure Pattern

Conflating related-but-separate concerns into a single documentation artifact based on superficial similarity (both involve comment syntax) rather than respecting architectural boundaries.

## Correct Solution

Split the documentation into two separate files in their appropriate packages:

1. **Compiler docs** (`packages/compiler/docs/comments.md`): Document only the comment syntax that the compiler recognizes (`;` and `#`)

2. **Editor docs** (`packages/editor/packages/editor-state/src/features/code-blocks/EDITOR_DIRECTIVES.md`): Document the editor-specific directive syntax and behavior

This respects the architectural boundary: the compiler package knows nothing about editor directives—they are simply comments from its perspective. Only the editor package needs to document how it interprets specially-formatted comments as directives.
