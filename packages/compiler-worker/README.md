# @8f4e/compiler-worker

Web Worker wrapper around the 8f4e compiler for live coding. It orchestrates compilation, memory creation, and memory diffing so the editor can push incremental updates efficiently.

## Responsibilities

- Run compilation off the main thread.
- Compare program and memory structure changes.
- Produce memory diffs for runtime updates.
