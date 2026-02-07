---
title: 'TODO: Add WebMCP-based MCP server integration to the 8f4e editor'
priority: Medium
effort: 2-4d
created: 2026-02-07
status: Open
completed: null
---

# TODO: Add WebMCP-based MCP server integration to the 8f4e editor

## Problem Description

The editor currently has no built-in MCP server integration path for browser-hosted workflows. That limits direct tool interoperability from within the 8f4e editor experience and makes experimentation with MCP-based editor features harder.

The experimental WebMCP API could provide a browser-native integration path, but the project does not yet have a spike/prototype to validate feasibility, compatibility, and security constraints.

## Proposed Solution

Create a focused integration spike that adds an MCP server bridge for the editor using the experimental WebMCP API:
- Evaluate the WebMCP API surface for browser compatibility in the current app architecture.
- Implement a minimal MCP server integration in the editor flow (feature-flagged).
- Define a small initial tool surface and message lifecycle.
- Document constraints, security assumptions, and fallback behavior when WebMCP is unavailable.

## Anti-Patterns (Optional)

- Shipping a default-on integration before browser/runtime behavior is validated.
- Binding editor internals directly to experimental API calls without an adapter boundary.
- Expanding tool scope before transport lifecycle and error handling are reliable.

## Implementation Plan

### Step 1: Research and adapter design
- Review WebMCP API capabilities and constraints.
- Add a lightweight adapter interface in editor-state/editor layers to isolate experimental APIs.
- Gate the integration behind a feature flag.

### Step 2: Minimal integration spike
- Implement a minimal MCP server connection lifecycle (init/connect/disconnect/error handling).
- Expose one or two safe read-only editor tools as a proof of integration.
- Wire status updates/events so UI and logs can surface MCP availability and failures.

### Step 3: Validation and docs
- Add tests around adapter behavior and fallback paths.
- Document setup steps, supported environments, and known limitations.
- Record follow-up TODOs for production hardening if the spike succeeds.

## Success Criteria

- [ ] Feature-flagged WebMCP integration path exists in the editor.
- [ ] Minimal MCP server lifecycle works in supported browsers.
- [ ] At least one editor-facing MCP tool is callable end-to-end.
- [ ] Fallback behavior is defined when WebMCP is missing or fails.
- [ ] Documentation captures experimental status and next steps.

## Affected Components

- `packages/editor-state/` - MCP integration state/events and feature gating
- `packages/editor/` - host wiring between editor and view/runtime APIs
- `packages/web-ui/` - status presentation and/or trigger plumbing for MCP lifecycle
- `docs/` - setup notes, limitations, and follow-up tasks

## Risks & Considerations

- **Experimental API volatility**: WebMCP API may change and require refactors.
- **Browser support**: not all target browsers may support required capabilities.
- **Security model**: must keep strict boundaries for tool exposure and message handling.
- **Maintenance overhead**: adapter and feature flags should contain churn from API evolution.

## Related Items

- **Related**: `docs/todos/091-optimize-dev-workflow-with-nx-caching.md`

## References

- [WebMCP API (experimental)](https://webmachinelearning.github.io/webmcp/)

## Notes

- Treat this as an integration spike first, not a production-ready commitment.
