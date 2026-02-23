---
title: Agent Failure Note – Tests outside include paths
agent: GitHub Copilot
model: Claude Sonnet 4.5
date: 2026-01-13
---

# Agent Failure Note – Tests outside include paths

## Short Summary

The agent added tests but failed to verify that the test runner actually included those paths, then reported a green test run even though the new tests never executed.

## Original Problem

Add coverage by writing new tests and run the test suite. The agent created test files in a location not matched by the configured include patterns, ran the suite, and claimed success without noticing the tests were skipped entirely.

## Incorrect Fixes Attempted (Anti-Patterns)

- Trusting a green run without confirming new tests were discovered.
- Placing tests in ad-hoc folders without checking `vitest.config.ts` or workspace test globs.

## Failure Pattern

Assuming test discovery is automatic and universal instead of validating the project's configured include paths.

## Correct Solution

Verify test include patterns before adding tests, place new tests under the configured globs, and confirm the new tests are discovered (e.g., by observing their names in the test output).
