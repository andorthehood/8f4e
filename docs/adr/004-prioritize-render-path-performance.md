# ADR-004: Prioritize Render Path Performance in Data Structure Selection

**Date**: 2025-11-22

**Status**: Accepted

## Context

During the refactoring of `CodeBlockGraphicData.extras` from `Map` instances to plain data structures (see [TODO-099](../todos/099-refactor-codeblock-extras-to-arrays.md)), we identified a pattern that applies broadly to editor architecture decisions:

1. **Performance-Critical Rendering**: The editor's rendering loop executes on every frame (or frequently during interactions). Code in this path must be optimized for speed since it directly affects perceived performance and responsiveness.

2. **Infrequent Updates**: In contrast, data structure updates (decorators, state transformations) typically happen less frequently - on code changes, viewport adjustments, or user interactions. These are not in the critical rendering path.

3. **Initial Object-Based Approach**: We initially refactored from `Map` to object dictionaries (`{ [id: string]: T }`), which improved JSON serialization but still required `Object.values()` calls in 8 drawer functions to iterate over items for rendering.

4. **Array Performance Win**: Switching to arrays eliminated all `Object.values()` overhead in the rendering path, allowing direct iteration with `for...of` loops. The cost was minimal - decorators now use `.push()` instead of keyed assignment, and tests use a `findExtrasById` helper for id-based lookups.

5. **Clear Trade-off**: The choice between objects (better for keyed access) and arrays (better for iteration) revealed that we should optimize for the performance-critical rendering path, even if it makes test code slightly more verbose.

## Decision

**When choosing data structures for editor state, we prioritize performance of the rendering path over convenience in non-critical paths.**

Specifically:

1. **Optimize for Iteration in Renderers**: If data will be iterated in rendering code (drawers, painting, hit-testing during mouse events), prefer data structures that iterate efficiently:
   - Arrays for simple iteration
   - Flat arrays over nested structures when possible
   - Avoid intermediate transformations like `Object.values()`, `Array.from()`, or `Map.values()` in hot paths

2. **Accept Complexity Elsewhere**: Non-critical paths (state updates, tests, initialization) can afford more complexity:
   - Helper functions for lookups (e.g., `findExtrasById`)
   - Linear searches in small datasets
   - More verbose test assertions

3. **Measure and Validate**: When the trade-off isn't obvious:
   - Profile or benchmark the rendering path
   - Consider the frequency: Does this code run every frame? On every mouse move? Only on user actions?
   - Prefer data structures that keep hot paths simple and fast

4. **Document Performance Intent**: When a data structure choice is driven by performance, document it:
   - In code comments for non-obvious choices
   - In type definitions if the structure seems unusual
   - In ADRs for architectural decisions

## Consequences

### Positive

1. **Better Frame Rate**: Optimizing the rendering path ensures smooth, responsive UI. Users directly perceive improvements here.

2. **Clear Decision Framework**: When facing data structure choices, developers can ask "Is this in the rendering path?" and make informed decisions.

3. **Prevents Premature Optimization**: We're not optimizing everything - only code that runs frequently in user-visible ways.

4. **Better Mental Model**: Separating "hot path" (rendering) from "cold path" (state updates, tests) helps reason about where performance matters.

5. **Scalability**: As the editor grows more complex, this principle ensures the rendering path stays fast even as features are added.

### Negative

1. **Potential Test Verbosity**: Tests may need helper functions (like `findExtrasById`) instead of direct keyed access. This is acceptable since tests don't run in production and clarity is more important than brevity.

2. **Requires Discipline**: Developers must remember to consider render path implications. Code reviews should verify this principle is followed.

3. **May Conflict with Other Goals**: Sometimes the "best" data structure for rendering conflicts with other goals (type safety, immutability, debuggability). We must consciously weigh these trade-offs.

### Neutral

- **Not a Blanket Rule**: This applies primarily to data structures used in rendering. Other parts of the codebase (compiler, runtime, utilities) may prioritize different concerns.
- **Technology-Agnostic**: While this decision references TypeScript/JavaScript specifics (arrays vs objects), the principle applies regardless of implementation language.

## Examples

### Example 1: CodeBlock Extras (This Decision)

**Before (Objects)**:
```typescript
// Type definition
type Extras = {
  switches: { [id: string]: Switch };
  buttons: { [id: string]: Switch };
  // ...
};

// Rendering (in drawer, runs frequently)
for (const switch of Object.values(codeBlock.extras.switches)) {
  drawSwitch(switch);  // Object.values() overhead
}

// Test (runs once)
expect(extras.switches['sw1']).toBeDefined();  // Direct, convenient
```

**After (Arrays)**:
```typescript
// Type definition
type Extras = {
  switches: Switch[];
  buttons: Switch[];
  // ...
};

// Rendering (in drawer, runs frequently)
for (const switch of codeBlock.extras.switches) {
  drawSwitch(switch);  // Direct iteration, no overhead
}

// Test (runs once)
expect(findExtrasById(extras.switches, 'sw1')).toBeDefined();  // Slightly more verbose
```

**Outcome**: Eliminated 8 `Object.values()` calls in hot rendering path. Tests use a helper but remain readable.

### Example 2: Hit Testing (Mouse Interaction)

**Performance-Aware Choice**:
```typescript
// Drawers iterate frequently -> use arrays
const buttons: Button[] = codeBlock.extras.buttons;

// Hit testing (on mouse move) iterates to find matches -> use arrays with early exit
function findButtonAtViewportCoordinates(x: number, y: number): Button | undefined {
  return codeBlock.extras.buttons.find(button => 
    x >= button.x && x <= button.x + button.width &&
    y >= button.y && y <= button.y + button.height
  );
}
```

Even though hit testing does a linear search, it's fast because:
- Arrays are cache-friendly for iteration
- `.find()` exits early on match
- Button counts are typically small (< 10 per code block)

### Example 3: Spatial Indexing (Future Consideration)

If performance profiling reveals hit testing is slow (e.g., thousands of buttons), we could add a spatial index:

```typescript
// Maintain a spatial grid for fast lookups
type SpatialIndex = Map<string, Button[]>;  // Key: "grid-x-y"

// Update is infrequent (on code change)
function buildSpatialIndex(buttons: Button[]): SpatialIndex {
  // More complex, but runs rarely
}

// Hit testing becomes O(1) instead of O(n)
function findButtonFast(x: number, y: number, index: SpatialIndex): Button | undefined {
  // Fast lookup in rendering path
}
```

This follows the principle: optimize the frequent path (lookup), accept complexity in the infrequent path (index building).

## Alternatives Considered

### 1. Always Use Objects for Keyed Data

**Rejected**: Objects provide convenient keyed access but require `Object.values()` for iteration. In rendering hot paths, this overhead is measurable. Tests can use helpers to maintain clarity.

### 2. Use Maps for "True" Collections

**Rejected**: `Map` instances are appropriate for arbitrary keys or key types other than strings/numbers, but:
- Not directly JSON-serializable
- Still require `Array.from(map.values())` for iteration
- More complex than arrays for simple use cases

### 3. Mixed Approach (Different Structures in Different Contexts)

**Considered but rejected for now**: Maintaining both an array (for rendering) and a map (for lookup) would be:
- More complex to keep in sync
- Uses more memory
- Only worth it if profiling shows lookup is a bottleneck (it hasn't)

May revisit if data volumes grow significantly.

### 4. Ignore Performance, Prioritize Developer Experience

**Rejected**: While developer experience is important, users perceive rendering performance directly. A slightly more verbose test is worth a smoother UI.

## Implementation Guidelines

When designing or modifying editor state:

1. **Identify the Rendering Path**: Trace data flow from state to screen. Which functions run every frame or on every mouse event?

2. **Optimize Hot Paths First**: 
   - Use arrays for iteration-heavy code
   - Avoid transformations and intermediate objects
   - Keep data flat when possible

3. **Use Helpers for Tests**:
   - Create utility functions like `findExtrasById` for test clarity
   - Document these helpers in test utils

4. **Profile When Uncertain**:
   - Use browser DevTools to profile rendering
   - Look for time spent in data transformations vs actual drawing
   - Optimize based on measurements, not assumptions

5. **Document Performance Choices**:
   - Add comments explaining why arrays over objects
   - Reference this ADR in relevant code
   - Update this ADR with new examples as they arise

## Related Decisions

- [TODO-099: Refactor CodeBlock Extras to Arrays](../todos/099-refactor-codeblock-extras-to-arrays.md) - The refactoring that motivated this ADR
- [ADR-001: Source-Based Development](001-source-based-development.md) - Similar principle of optimizing developer workflow

## References

- V8 Performance Tips: https://v8.dev/blog/elements-kinds
- JavaScript Array Performance: https://v8.dev/blog/fast-properties
- Rendering Performance: https://web.dev/rendering-performance/
