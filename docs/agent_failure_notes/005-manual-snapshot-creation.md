---
title: Agent Failure Note – Manual Snapshot Creation
agent: codex-cli 0.93.0
model: gpt-5.2-codex
date: 2026-02-02
---

# Agent Failure Note – Manual Snapshot Creation

## Short Summary

The agent created a snapshot file by hand instead of letting the test runner generate it, bypassing the testing workflow and risking mismatch with actual output.

## Original Problem

User requested a snapshot test. The agent wrote the snapshot file directly without running Vitest to generate it, then later had to delete it and rerun tests.

## Incorrect Fixes Attempted (Anti-Patterns)

- Manually authoring the snapshot file to match expected output.

Why this is wrong: snapshots are meant to capture real runtime output. Hand-editing decouples the test artifact from the actual code behavior and can hide regressions.

## Failure Pattern

Bypassing the test runner to fabricate artifacts instead of generating them from execution.

## Correct Solution

Run the snapshot test with the correct update flag so the tool generates the snapshot from real output, and commit the generated file.
