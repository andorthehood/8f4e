---
title: 'TODO: Load project from query param URL'
priority: Medium
effort: 4-8h
created: 2026-02-18
status: Open
completed: null
---

# TODO: Load project from query param URL

## Problem Description

Projects can be loaded from built-in sources and local import flows, but there is no direct way to deep-link the editor to a project JSON hosted on the web.

## Requested Behavior

- Support URL query param format:
  - `?project=https://example.com/project.json`
- On app load, if `project` query param exists, fetch that URL and load the project into the editor.
- Query-param project takes precedence over hash/localStorage/default loading for that startup.

## Scope (MVP)

- Read `project` from query params at startup.
- Fetch JSON from the provided URL.
- Parse and validate against existing project import expectations.
- Load project through the existing project-load path.
- Implement in app-layer startup callback flow (`loadSession`) rather than introducing new editor-state events.

## Validation and Safety Rules

- Accept only `http:` and `https:` URLs.
- Reject invalid/malformed URLs with clear user-visible error.
- Handle fetch failures cleanly (network/CORS/non-200/invalid JSON).
- Do not break current startup flow when query param is absent.

## Implementation Plan

### Step 1: Query param parsing
- Read and decode `project` from `window.location.search`.
- Validate URL protocol and basic format.

### Step 2: Remote fetch + parse
- Fetch URL content.
- Parse JSON and validate shape (using current import validation path).

### Step 3: Load integration
- Integrate in `src/storage-callbacks.ts` `loadSession()`:
  - if query project URL succeeds, return it immediately
  - otherwise fall back to existing order:
    1. hash-based project slug
    2. localStorage project
    3. default bundled project

### Step 4: Error handling UX
- Display clear message/log on invalid URL, fetch failure, CORS, or bad payload.
- Keep editor usable even when remote load fails.

### Step 5: Tests
- Add tests for:
  - valid query URL load path
  - missing param (no behavior change)
  - malformed URL
  - unsupported protocol
  - failed fetch / invalid JSON

## Success Criteria

- [ ] `?project=<https-url>` loads the referenced project at startup.
- [ ] Invalid/failed URLs do not crash app startup.
- [ ] Existing startup behavior remains unchanged when param is absent.
- [ ] Tests cover success and failure paths.

## Affected Components

- `src/storage-callbacks.ts` (`loadSession` query-param + fetch logic)
- App startup/query parsing path (root app)
- `packages/editor/packages/editor-state/src/features/project-import/*` (integration)
- Related tests for startup/import behavior

## Notes

- This TODO records requested behavior only. Implementation is intentionally deferred.
