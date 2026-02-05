---
title: Agent Failure Note – Created File Instead of Directory
agent: GitHub Copilot Workspace Agent
model: Claude Sonnet 4.5
date: 2026-02-03
---

# Agent Failure Note – Created File Instead of Directory

## Short Summary

Ambiguous wording led the agent to create a single file instead of a directory-based note structure.

## Original Problem

When asked to "add a note into agent_failure_notes", the agent created `docs/agent_failure_notes.md` instead of placing a note file inside `docs/agent_failure_notes/`, requiring a corrective commit.

## Incorrect Fixes Attempted (Anti-Patterns)

- Assuming a single file was acceptable without checking for an existing directory.
- Not verifying existing structure before writing.

## Failure Pattern

Interpreting a plural or collection name as a file path without validating the filesystem.

## Correct Solution

1. Verify whether `docs/agent_failure_notes/` exists before writing.
2. Create or update a note file inside the directory.
3. Use descriptive file names for individual notes (e.g., `008-node-modules-committed.md`).
