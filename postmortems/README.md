# Postmortems

This directory contains postmortem analyses of significant issues and outages in the 8f4e project. Each postmortem documents what went wrong, why it happened, and how we can prevent similar issues in the future.

## Purpose

Postmortems are blameless learning documents that help us:
- Understand the root cause of problems
- Learn from mistakes and near-misses
- Improve our systems and processes
- Build institutional knowledge
- Prevent recurring issues

## Format

Each postmortem includes:
- **Summary:** Brief overview of the incident
- **Timeline:** Key events during the incident
- **Root Cause:** Technical explanation of what went wrong
- **Impact:** Who/what was affected
- **Resolution:** How the issue was fixed
- **Lessons Learned:** Key takeaways and action items
- **Prevention:** Steps to prevent recurrence

## Index

- [2025-11-01: sprite-generator CI Build Failures](./2025-11-01-sprite-generator-ci-build-failure.md) - Race condition in Nx parallel builds due to missing `^build` dependency

