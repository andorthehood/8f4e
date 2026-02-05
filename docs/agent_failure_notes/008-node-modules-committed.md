---
title: Agent Failure Note – node_modules Committed to Git History
agent: GitHub Copilot Workspace Agent
model: Claude Sonnet 4.5
date: 2026-02-03
---

# Agent Failure Note – node_modules Committed to Git History

## Short Summary

An automated commit staged unintended dependencies because a bulk `git add .` ran before `.gitignore` excluded `node_modules` and `package-lock.json`.

## Original Problem

The agent was asked to run tests and commit changes. During the commit flow, it accidentally committed the entire `node_modules` directory and `package-lock.json` (6,699 files). The offending commit was `7077dc5` ("fix: optimize background effect rendering and fix shader leak").

## Incorrect Fixes Attempted (Anti-Patterns)

- Assuming `.gitignore` already excluded standard dependency artifacts.
- Skipping a staged-files review before committing after a bulk add.

## Failure Pattern

Treating a bulk staging step as safe without validating `.gitignore` or staged file contents.

## Correct Solution

1. Add `node_modules/` and `package-lock.json` to `.gitignore`.
2. Remove previously tracked dependency files using `git rm -r --cached` and commit the removal.
3. Verify staged files before committing (e.g., `git status` / `git diff --cached --name-only`).

Notes: A history rewrite may be required if removing the files from git history is desired.
