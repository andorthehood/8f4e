# Editor State Package

This package implements a platform-agnostic editor state machine. It owns the full application state shape and the logic that updates that state in response to internal events, without depending on platform specific APIs.

## Execution Entry Outlines

Entry outlines surround the module and project-group blocks belonging to each execution entry in the current view.
Entries containing only groups also receive an outline, including empty groups. Opening a group recalculates the
outlines from that group's visible blocks; child blocks do not affect the enclosing view's outline geometry.
