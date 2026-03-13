---
title: Agent Failure Note – OpenAI Codex app formatting rules leaked into repo docs
agent: Codex App Version 26.305.950 (863)
model: gpt-5.4 (medium)
date: 2026-03-13
---

# Agent Failure Note – OpenAI Codex app formatting rules leaked into repo docs

## Short Summary

The agent applied response-formatting rules added by OpenAI for the Codex app chat environment to a checked-in Markdown document. Specifically, an OpenAI Codex app instruction requiring absolute filesystem paths in chat responses was incorrectly copied into repository docs, producing non-portable local links.

## Original Problem

The task was to create a contributor-facing document about editor directives under `packages/editor/docs/`.

Instead of writing normal repository Markdown links, the agent inserted absolute local paths such as `/Users/andorpolgar/...` into the document. Those links were only valid as clickable references in chat responses, not as repo documentation.

The source of that mistake was an instruction added by OpenAI for the Codex app chat environment: assistant responses should use absolute filesystem paths so file references are clickable in the app UI. That instruction was about chat output, not about checked-in Markdown files in the repository.

## Anti-Patterns

1. Treating response-formatting instructions as if they also govern checked-in source files.
2. Copying chat-specific file reference conventions directly into repository Markdown.
3. Optimizing for local UI clickability instead of the conventions and portability of the repository itself.

Why this is wrong:
- Repository docs should be readable and valid in GitHub, editors, and other environments.
- Absolute local paths are machine-specific and non-portable.
- It confuses two different output targets: chat responses and source files.
- It incorrectly elevates Codex app UI instructions above repository conventions.

## Failure Pattern

Leaking environment-specific response conventions into persistent project artifacts.

## Correct Solution

Use the chat formatting rules only in assistant responses.

For checked-in documentation:
- use normal relative Markdown links,
- follow repository documentation conventions,
- and optimize for portability and readability in the repo, not the chat client.

When a rule comes from the OpenAI Codex app and is clearly about how the assistant should format references in conversation, it should not be copied into generated source files unless the user explicitly asks for that style.
