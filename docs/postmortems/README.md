# Mini postmortems

This directory contains short records of problems encountered while working on 8f4e. They are not formal incident reports, and a problem does not need to cause an outage or have significant impact to belong here.

## Why I keep them

Using AI agents makes it much faster and easier to fix bugs, but it also creates a risk of deskilling. Before I used agents, the difficult process of investigating and fixing a problem made the solution more likely to stick in my memory. When an agent performs most of that work, I can accept the result without fully internalizing what caused the problem, making it easier to run into the same issue again.

Writing these mini postmortems is an attempt to preserve that learning. Each note gives me a reason to revisit the investigation, identify the essential lesson, and leave a concise record for my future self. The goal is to benefit from the speed of agent-assisted development without giving up the knowledge that normally comes from solving problems by hand.

## Format

The format is intentionally lightweight. A mini postmortem should capture:

- **Symptom:** What went wrong and how it appeared
- **Root cause:** Why it happened
- **Resolution:** What fixed it
- **Lesson:** What is worth remembering when the same pattern appears again

Additional details such as a timeline, impact, references, or prevention steps can be included when they make the lesson clearer.

## Index

- [2026-09-02: Safari Cross-Origin Font Loading](./2026-09-02-safari-cross-origin-font-loading.md) - A cross-origin font required an explicit CORP header on the COEP-enabled website
- [2026-01-23: Nx Daemon Disabled by Socket Error](./2026-01-23-nx-daemon-disabled-marker.md) - An `EPERM` socket error left Nx watch targets blocked by a disabled marker
- [2025-11-05: Netlify Build TypeScript Resolution Failure](./2025-11-05-netlify-build-typecheck-dependency.md) - A missing Nx dependency caused type-checking to race upstream builds
- [2025-11-03: Git Push "bad object" Error](./2025-11-03-git-push-bad-object-error.md) - Branch divergence after GitHub PR merge caused push failure
- [2025-11-01: sprite-generator CI Build Failures](./2025-11-01-sprite-generator-ci-build-failure.md) - Race condition in Nx parallel builds due to missing `^build` dependency
