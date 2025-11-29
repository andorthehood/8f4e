## Decoupling execution order from memory layout

Goal: allow execution order of modules to be independent from their placement in the linear memory, so that we can add modules without rebuilding/reinitializing the entire memory.

### Current situation (problem)

- Execution order and memory layout are tightly coupled: if a module comes first in execution order, it is also first in memory.
- Adding a new module often requires "squeezing" it between existing modules to preserve this coupling.
- This forces us to rebuild/reinit the whole memory and reassign addresses, which is bad for performance and makes incremental edits expensive.

### Target model

- Treat execution scheduling and memory layout as two separate concerns:
  - `executionOrder: ModuleId[]` — pure topological / scheduled order derived from the graph (e.g. in `graphOptimizer.ts`).
  - `memoryLayout: { [moduleId: string]: number }` — mapping from module → base address in memory.
- All consumers should rely on the compiler-provided memory map (addressable by id).

### Behavior for adds (near-term)

- When adding a new module:
  - Re-run the graph optimizer to compute a new `executionOrder`.
  - Keep existing `memoryLayout` unchanged for existing modules.
  - Track a `nextFreeAddress` (and module sizes); assign the new module an address at the end of memory and advance `nextFreeAddress`.
  - This avoids shuffling existing modules in memory on each add.

### Behavior for removals (near-term)

- For the first iteration, on module removal:
  - Re-run the graph optimizer to compute the new `executionOrder`.
  - Trigger a full memory reinit with a fresh `memoryLayout` (pack modules tightly and recompute all addresses).
  - This keeps the logic simple and correct while we still get the benefits for module additions.

### Editor ordering vs memory layout (open problem)

- In the editor, Z-index is currently correlated with code module ordering.
- For memory layout, we want newest modules to be at the end of the list (so they can be appended in memory), regardless of their Z-index.
- Attach a stable "creation order" field to each module (e.g. a monotonically increasing `creationIndex` or a `createdAt` timestamp) when it is first added.
- When sending modules to the compiler, sort them by this creation order so that newly added modules come last in the list and can be appended at the end of memory.
- Reordering modules visually in the editor should only affect Z-index, not the creation order used for memory layout.

### Future improvements

- Smarter handling of removals:
  - Track freed ranges and reuse them for future modules (simple free-list allocator).
  - Only occasionally compact memory (e.g. when fragmentation exceeds some threshold) instead of on every removal.
- Incremental graph optimization:
  - If `graphOptimizer.ts` allows it, support incremental updates to `executionOrder` rather than full recomputation.
- Potential `OptimizedProgram` shape:
  - `executionOrder: ModuleId[]`
  - `memoryLayout: { [moduleId: string]: number }`
  - `totalSize: number`
  - Optional free-list metadata (for later fragmentation handling).
