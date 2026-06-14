---
title: 'TODO: Store project block type during project parse'
priority: Medium
effort: 2-4h
created: 2026-06-01
issue: null
status: Superseded
completed: 2026-06-11
---

# Superseded

This todo was superseded by the project-preparser pipeline refactor.

Project parsing moved from `@8f4e/tokenizer` to `@8f4e/project-preparser`, and the old compiler-block picking layer was removed in favor of preparing the exact `CompileInput` shape directly from project blocks.
