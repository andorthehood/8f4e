---
title: 'TODO: Add Typecheck GitHub Action'
priority: Medium
effort: 2-3h
created: 2025-11-09
status: Completed
completed: 2025-11-09
---

# TODO: Add Typecheck GitHub Action

## Problem Description

Nx projects already expose a unified `typecheck` target (`npm run typecheck` → `npx nx run-many --target=typecheck --all`), but CI currently stops after linting and testing (`.github/workflows/test.yml`). That means:
- Type-only regressions can merge when contributors skip the local pre-commit hook or run web-based edits.
- Packages that are not touched by staged files (e.g., nested Nx libs) never get typechecked outside of a developer's machine.
- Release workflows (`deploy-editor-bundle`, `deploy-runtime-main-thread-logic`) assume type safety but rely on manual discipline rather than automation.

For a workspace that shares types across editor, compiler, runtime, and docs packages, missing a CI-level typecheck increases the risk of shipping invalid declaration files or breaking consumer packages that rely on the published `dist/` artifacts.

## Proposed Solution

Extend `.github/workflows/test.yml` with an additional job (or step) that runs `npm run typecheck` on every push and pull request targeting `main` or `staging`.
- Reuse the existing workflow conventions: `actions/checkout@v4`, `actions/setup-node@v4` with `.nvmrc`, and `npm ci`.
- Enable Nx caching (either local or Nx Cloud if configured) so repeated runs stay fast.
- Keep the workflow single-sourced so the VM setup (checkout, dependency install, cache warm-up) only happens once per CI run.

## Implementation Plan

### Step 1: Verify Nx Typecheck Targets
- Confirm every package exposes a `typecheck` target that runs `tsc --noEmit` against the correct `tsconfig`.
- Add missing targets (especially nested libs under `packages/editor/**`) to avoid blind spots once CI invokes `run-many`.

### Step 2: Extend the Test Workflow
- Add a dedicated `typecheck` job (or sequential step) inside `.github/workflows/test.yml`.
- Share the existing checkout/install steps (or use `needs` if running in parallel) so we don’t duplicate setup work.
- Cache the npm store (already handled by `actions/setup-node` with `cache: 'npm'`) to keep runtime under 2–3 minutes.

### Step 3: Wire Into Branch Protection & Docs
- If keeping a separate workflow, add it to required status checks on `main`/`staging`.
- Update contributor docs (README or AGENTS) to mention the new CI gate so developers run `npm run typecheck` locally before pushing.

## Success Criteria

- [ ] Workflow triggers on `push`/`pull_request` for `main` and `staging`.
- [ ] `npm run typecheck` executes `nx run-many --target=typecheck --all` without timing out.
- [ ] Workflow fails when any package emits a TypeScript error.
- [ ] Branch protection (where enabled) blocks merges until the typecheck job succeeds.

## Affected Components

- `.github/workflows/test.yml` – extend this workflow with a typecheck job/step.
- `nx.json` / per-package `project.json` – ensure every project defines the `typecheck` target invoked by CI.
- `docs/README.md` (or contributor guide) – document the new automation requirement.

## Risks & Considerations

- **Longer CI time**: Running `tsc` across every package adds 2–3 minutes; mitigate with Nx caching or parallelization.
- **Missing targets**: Packages without a `typecheck` target will cause the workflow to fail until their configs are updated.
- **Branch protection coordination**: Updating required checks must happen in sync with merging the workflow to avoid blocking all PRs.
- **Nx Cloud credentials**: If we enable remote caching, ensure secrets are available to GitHub Actions.

## Related Items

- **Related**: TODO-091 (optimize dev workflow with Nx caching) – both efforts focus on leveraging Nx tooling consistently.
- **Depends on**: None.
- **Blocks**: Future CI hardening tasks that assume typecheck coverage.

## References

- [Nx docs: running custom targets in CI](https://nx.dev/ci/intro/ci-with-nx)
- [GitHub Actions: workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)

## Notes

- `lint-staged` already runs `npm run typecheck` locally, but it only covers staged files. The workflow should always use `run-many` to typecheck the entire graph so editors/tests that rely on generated types stay safe.
- Consider reusing the same Node version (`.nvmrc`) and caching strategy as the test workflow to keep maintenance simple.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` if the current date is not provided)
