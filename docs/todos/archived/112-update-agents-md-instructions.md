---
title: 'TODO: Audit and Update AGENTS.md Instructions'
priority: Medium
effort: 1–2d
created: 2025-12-01
status: Done
completed: 2025-12-01
---

# TODO: Audit and Update AGENTS.md Instructions

## Problem Description

`AGENTS.md` files are used to give AI assistants contextual instructions about how to work in this repo (commands to run, coding style, project structure, etc.). Over time, some of these instructions have become outdated or inconsistent with the current tooling and workflows.

- What is the current state?
  - There are one or more `AGENTS.md` files at the repo root and possibly in subdirectories, each providing scoped guidance.
  - Some content references older workflows, such as direct `npm` scripts, that have since been replaced or wrapped by Nx tasks.
  - Other details (paths, package names, testing commands) may no longer match the current codebase.
  - There is no systematic process for keeping `AGENTS.md` files in sync with changes to tooling and project structure.
- Why is this a problem?
  - AI assistants following outdated instructions may:
    - Call the wrong commands (e.g. `npm run build` instead of `nx run-many ...` where the repo prefers Nx).
    - Miss newer patterns or conventions that should be followed.
    - Provide guidance or make changes that diverge from current best practices.
  - Inconsistent instructions across `AGENTS.md` scopes can be confusing and error-prone.
- What impact does it have?
  - Reduced effectiveness and reliability of AI assistance in the repo.
  - Extra friction for contributors relying on AI-guided workflows.
  - Higher risk of actions that conflict with the intended Nx-centric tooling and updated project layout.

## Proposed Solution

Perform a focused audit of all `AGENTS.md` files, update them to reflect current tooling and conventions, and establish clearer, Nx-aligned guidance for AI assistants, including explicit mention of the Nx MCP server and its tools, as well as explicit editing rules for comments (no inline implementation comments, JSDoc preferred).

High-level goals:

- Ensure all instructions about build, test, and dev workflows align with the current Nx setup.
- Remove or correct references to obsolete `npm` scripts or tooling where Nx tasks should be used instead.
- Harmonise overlapping or conflicting guidance across different `AGENTS.md` scopes.
- Keep the documents concise, accurate, and easy to extend as the repo evolves.

## Implementation Plan

### Step 1: Discover all AGENTS.md files and their scopes

- Search the repository for all `AGENTS.md` files, including:
  - The root-level `AGENTS.md`.
  - Any nested `AGENTS.md` in package or feature directories.
- For each file:
  - Note its directory scope (the directory tree it governs).
  - Summarise its current guidance (tooling, commands, coding style).
- Expected outcome:
  - A clear inventory of all `AGENTS.md` files and how their scopes overlap.
- Dependencies:
  - None; basic repository scan.

### Step 2: Identify outdated or conflicting instructions

- For each `AGENTS.md`:
  - Flag references to tooling or commands that are no longer accurate, such as:
    - Direct `npm` scripts that have been replaced or wrapped by Nx tasks.
    - Old build/test commands that don’t match the current Nx configuration.
    - Deprecated package names, paths, or project structures.
  - Identify any conflicts between root-level guidance and nested `AGENTS.md` files (e.g. different recommended commands for the same operation).
- Expected outcome:
  - A list of specific changes needed per `AGENTS.md` file.
- Dependencies:
  - Step 1 (inventory of files).

### Step 3: Update instructions to be Nx- and current-tooling-aligned

- For each `AGENTS.md`:
  - Replace outdated `npm` script recommendations with the preferred Nx commands where applicable (e.g. use `nx run`, `nx test`, `nx build`, `nx affected`, etc.).
  - Align guidance with current repository practices, including:
    - How to build, test, and run specific projects or packages.
    - Explicit mention of the Nx MCP server and guidance on when/how agents should use its tools (e.g. `nx_workspace`, `nx_project_details`, `nx_docs`).
    - Clear editing rules for AI agents regarding comments:
      - Do not add inline implementation comments inside code (e.g. trailing `//` remarks or per-line explanations).
      - You may add or update JSDoc-style comments for functions, classes, and modules when they improve clarity.
      - Prefer expressing intent via JSDoc and naming rather than scattered inline comments.
  - Clarify when direct tools (e.g. raw `vitest`, `vite`, `tsc`) are acceptable vs when Nx should be preferred.
- Keep wording concise and consistent with the root `AGENTS.md` style.
- Expected outcome:
  - All `AGENTS.md` files point assistants at the correct, modern commands and tools.
- Dependencies:
  - Step 2 (identified issues).

### Step 4: Harmonise and document precedence rules where helpful

- Where nested `AGENTS.md` files legitimately override root instructions:
  - Make the override explicit (“In this package, do X instead of Y”).
  - Ensure that the override is truly necessary and not just drift.
- Where differences are unintentional:
  - Consolidate on a single recommended pattern.
- Optionally add a short note in the root `AGENTS.md` explaining:
  - That nested `AGENTS.md` exist and how their scope precedence works.
  - That Nx should be preferred for cross-package tasks.
- Expected outcome:
  - Assistants can easily reason about which instructions apply where, without confusion.
- Dependencies:
  - Step 3 (updated content).

### Step 5: Add a light maintenance note or checklist

- In the root `AGENTS.md` (or a central place), add a short maintenance note such as:
  - “When changing tooling (e.g. build/test commands, Nx targets), remember to update relevant `AGENTS.md` files.”
- Optionally:
  - Add a small checklist or link in contributor docs to encourage keeping `AGENTS.md` in sync with future changes.
- Expected outcome:
  - Future changes to tooling are more likely to be reflected in `AGENTS.md`, reducing drift.
- Dependencies:
  - Steps 1–4.

## Success Criteria

- [ ] All `AGENTS.md` files reference current Nx-based workflows for build/test/dev where appropriate.
- [ ] Obsolete `npm` script references (that were replaced by Nx) are removed or updated.
- [ ] There are no conflicting instructions between `AGENTS.md` files at different scopes for the same operations, unless explicitly documented as overrides.
- [ ] Root-level `AGENTS.md` clearly reflects current repository structure and tooling choices.
- [ ] A short note or checklist exists to remind maintainers to update `AGENTS.md` when tooling changes.

## Affected Components

- `AGENTS.md` (root)
  - Update to reflect current Nx workflows and tooling, plus any maintenance notes.
- `**/AGENTS.md` (nested)
  - Update per-package or per-feature instructions to stay aligned with the root and current project structure.
- `docs/` (optional)
  - If there is a contributor or workflow doc referencing `AGENTS.md`, ensure it remains consistent with the updated guidance.

## Risks & Considerations

- **Risk 1: Partial updates**
  - Updating only some `AGENTS.md` files could lead to mixed guidance.
  - Mitigation: Perform a thorough inventory and ensure all located files are audited in this pass.
- **Risk 2: Future drift**
  - As tooling changes, `AGENTS.md` content may become outdated again.
  - Mitigation: Add a brief maintenance note/checklist and, if possible, mention AGENT guidance in PR templates or internal process docs.
- **Dependencies**:
  - Stable understanding of current Nx configuration and preferred workflows.
- **Breaking Changes**:
  - None for runtime behaviour; this affects documentation for AI assistants and contributors only.

## Related Items

- **Related**:
  - Root `AGENTS.md` and any nested `AGENTS.md` files.
  - `docs/nx-workflow.md` (if present), which may describe the intended Nx-centric workflows that AGENT instructions should refer to.

## References

- `AGENTS.md` (root) — current top-level instructions to agents.
- `docs/nx-workflow.md` — Nx workflow description and best practices.

## Notes

- This TODO is about documentation alignment, not changing the actual build/test tooling; it should follow, not drive, Nx configuration and script changes.
