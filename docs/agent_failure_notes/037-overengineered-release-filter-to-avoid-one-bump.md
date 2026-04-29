---
title: Agent Failure Note - Overengineered release filter to avoid one bump
agent: Codex App Version 26.422.71525 (2210)
model: GPT-5.5 (High)
date: 2026-04-29
---

# Agent Failure Note - Overengineered release filter to avoid one bump

## Short Summary

The agent treated one acceptable catch-up release bump as worse than adding and maintaining a custom release-selection script. That was the wrong tradeoff: release policy should stay in Nx conventional-commit configuration unless there is a clear long-term need for custom orchestration.

## Original Problem

The repository needed a manual release workflow that could version independently released packages and bump dependent packages when a dependency changed. The user did not want unrelated packages to be bumped on every release.

After switching to dependent package bumps, the agent kept adding logic to `scripts/resolve-release-projects.mjs` to preserve a narrower release set. This script inspected project roots, latest project tags, changed files, and later commit subjects. The immediate motivation was to avoid one broad bump caused by previous release-related commits.

## Anti-Patterns

- Adding a custom release-selection script before accepting a one-time version correction.
- Optimizing for a cleaner next release at the cost of owning bespoke release logic forever.
- Reimplementing parts of Nx project and release selection instead of relying on Nx release configuration.
- Treating "avoid a bump" as more important than keeping release automation simple and inspectable.
- Making future agents reason about custom release behavior when conventional commits and Nx already cover the desired steady state.

```bash
# wrong direction: custom release filtering to avoid one broad catch-up bump
release_projects="$(node scripts/resolve-release-projects.mjs)"
npx nx release --projects="$release_projects" --skip-publish
```

This was the wrong boundary. Nx should own release detection, version bumps, dependent updates, manifest changes, commits, and tags. A custom script should only exist if the repository has a durable policy Nx cannot express.

## Failure Pattern

Avoiding a small, tolerable one-time state correction by introducing permanent orchestration complexity.

## Correct Solution

Use Nx release directly with conventional commits:

```bash
npx nx release --skip-publish
```

Keep release semantics in `nx.json` and commit-message guidance:

- `fix` triggers patch releases.
- `feat` triggers minor releases.
- breaking changes trigger major releases.
- `docs` and `chore` commits do not trigger package releases.
- `version.updateDependents: "always"` lets Nx bump dependent packages automatically.

If historical commits cause one broad catch-up bump, tolerate it once. After that, generated release commits and release-workflow maintenance should use non-release commit types such as `chore(release)`, `chore(ci)`, or `chore(tooling)`, so they do not keep triggering package releases.
