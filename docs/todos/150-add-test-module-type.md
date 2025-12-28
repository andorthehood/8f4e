---
title: 'TODO: Add Test Module Type'
priority: Medium
effort: 2-4d
created: 2025-12-28
status: Open
completed: null
---

# TODO: Add Test Module Type

## Problem Description

The current 8f4e workflow only supports runtime modules intended for execution, not for structured testing. Validation is largely manual or relies on ad-hoc harnesses, which makes it harder to express expected behavior, automate verification, and keep test coverage aligned with new language features.

## Proposed Solution

Introduce a dedicated code module type for tests that the compiler/runtime can recognize and execute in a controlled way. The test module type should allow declaring expectations (outputs, state changes, timing constraints) and return structured results that the editor and tooling can surface.

## Implementation Plan

- None yet

## References

- None yet

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
