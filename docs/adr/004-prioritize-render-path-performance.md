# ADR-004: Prioritize Render Path Performance in Data Structure Selection

**Date**: 2025-11-22

**Status**: Accepted

## Context

In interactive applications like code editors, the rendering loop executes frequently—often on every frame or during user interactions like mouse movements. Performance in this "hot path" directly impacts user experience through perceived responsiveness and smoothness.

Conversely, other operations such as state updates, initialization, and test execution typically occur less frequently and are not as time-sensitive. These "cold paths" can tolerate more complex or verbose code without affecting user experience.

When selecting data structures for application state, we face trade-offs:
- **Iteration efficiency** (arrays, flat structures) vs **lookup efficiency** (maps, indexed objects)
- **Rendering performance** vs **update convenience** or **test clarity**
- **Simple hot paths** vs **complex cold paths**

We need a principle to guide these decisions consistently across the codebase.

## Decision

**When choosing data structures for editor state, prioritize performance of the rendering path over convenience in non-critical paths.**

### Guidelines

1. **Optimize for Iteration in Rendering Code**: 
   - If data is iterated during rendering (drawing, painting, hit-testing), choose structures optimized for iteration
   - Prefer arrays for simple iteration over collections
   - Use flat structures over deeply nested ones when rendering needs to traverse them
   - Avoid intermediate transformations (e.g., `Object.values()`, `Array.from()`, `Map.values()`) in hot paths

2. **Accept Complexity in Cold Paths**: 
   - Non-critical code (state updates, tests, initialization) can use helper functions and more verbose patterns
   - Linear searches are acceptable in small datasets that aren't on the render path
   - Test code can be more verbose if it simplifies production code

3. **Measure When Trade-offs Aren't Clear**:
   - Profile or benchmark the rendering path when performance impact is uncertain
   - Ask: How often does this code run? Every frame? On mouse move? Only on user action?
   - Choose based on frequency and user-visible impact

4. **Document Performance-Driven Choices**:
   - Add comments explaining performance rationale for non-obvious data structure choices
   - Reference this ADR in code reviews when performance considerations drive decisions
   - Update this ADR with new examples as patterns emerge

## Consequences

### Positive

1. **Improved User Experience**: Optimized rendering ensures smooth, responsive UI that users directly perceive

2. **Clear Decision Framework**: Developers have a consistent principle for data structure choices: "Is this in the rendering path?"

3. **Prevents Premature Optimization**: Focus optimization where it matters (hot paths) rather than everywhere

4. **Scalable Architecture**: As features grow, render path performance remains protected by design

5. **Better Mental Model**: Explicit separation of "hot" vs "cold" paths clarifies where performance matters

### Negative

1. **Increased Complexity in Cold Paths**: Tests and updates may require helper functions instead of direct access patterns

2. **Requires Ongoing Discipline**: Developers must remember to consider render path implications during code reviews

3. **Potential Conflicts with Other Goals**: Performance-optimal structures may conflict with type safety, immutability, or debuggability—requiring conscious trade-offs

### Neutral

- **Not Universal**: This applies primarily to rendering-related state. Other subsystems (compiler, runtime) may prioritize different concerns
- **Language-Agnostic Principle**: While examples use TypeScript/JavaScript, the principle applies across languages and frameworks

## Examples

### Example 1: Collection Iteration in Rendering

**Scenario**: State contains collections that rendering code must iterate.

**Performance-Aware Choice**:
```typescript
// Use arrays for hot-path iteration
const items: Item[] = [...];

// Rendering (runs frequently)
for (const item of items) {
  drawItem(item);  // Direct, fast iteration
}

// Update (runs infrequently) - acceptable to search
function updateItem(id: string, data: Partial<Item>) {
  const item = items.find(i => i.id === id);
  if (item) Object.assign(item, data);
}

// Tests can use helpers
const findById = (id: string) => items.find(i => i.id === id);
expect(findById('item1')).toBeDefined();
```

**Alternative (Not Preferred)**:
```typescript
// Objects optimize updates but hurt rendering
const items: { [id: string]: Item } = {...};

// Rendering (runs frequently)
for (const item of Object.values(items)) {  // Overhead on every frame
  drawItem(item);
}
```

### Example 2: Hit Testing During Mouse Events

**Scenario**: Finding which UI element the mouse is over.

**Performance-Aware Choice**:
```typescript
// Arrays with early-exit search are fast enough for small datasets
const buttons: Button[] = [...];

function findButtonAt(x: number, y: number): Button | undefined {
  return buttons.find(btn =>  // Linear search with early exit
    x >= btn.x && x <= btn.x + btn.width &&
    y >= btn.y && y <= btn.y + btn.height
  );
}
```

This is acceptable because:
- Hit testing runs on mouse move (frequently) but...
- Button counts are typically small (< 20 per view)
- Early exit makes average case fast
- Arrays are cache-friendly for iteration

**When to Use Spatial Index** (future consideration):
If profiling shows hit testing is slow (e.g., thousands of elements), add a spatial index:
```typescript
// Build index infrequently (on layout change)
const spatialIndex: Map<string, Button[]> = buildSpatialGrid(buttons);

// Lookup is fast (O(1) grid cell lookup)
function findButtonAtFast(x: number, y: number): Button | undefined {
  const cell = getCellKey(x, y);
  return spatialIndex.get(cell)?.find(/* ... */);
}
```

The complexity shifts to the cold path (index building) while keeping the hot path (lookup) fast.

### Example 3: Nested Data in Rendering

**Scenario**: Rendering needs to traverse nested structures.

**Performance-Aware Choice**:
```typescript
// Flatten for rendering performance
interface FlatRenderData {
  items: RenderItem[];  // Pre-flattened, ready to iterate
}

// Update path can build the flat structure
function updateFromNestedState(nested: NestedState): FlatRenderData {
  return {
    items: flatten(nested)  // One-time cost during update
  };
}

// Rendering is simple and fast
for (const item of renderData.items) {
  draw(item);
}
```

**Alternative (Not Preferred)**:
```typescript
// Nested structure requires traversal every frame
interface NestedRenderData {
  groups: { items: RenderItem[] }[];
}

// Rendering must traverse and flatten repeatedly
for (const group of renderData.groups) {
  for (const item of group.items) {  // Nested iteration overhead
    draw(item);
  }
}
```

## Implementation Guidelines

When designing or reviewing code:

1. **Identify the Rendering Path**: Trace data flow from state to screen. Which functions run every frame?

2. **Optimize Hot Paths First**:
   - Choose iteration-friendly structures (arrays, flat data)
   - Minimize transformations and allocations
   - Profile when unsure

3. **Document Trade-offs**:
   - Comment on performance-driven choices
   - Explain why cold-path complexity is acceptable
   - Link to this ADR in relevant discussions

4. **Use Helpers for Cold Paths**:
   - Create utility functions for tests and updates
   - Document these helpers clearly
   - Keep them in dedicated modules

5. **Measure, Don't Assume**:
   - Use browser DevTools profiling
   - Look for time in data transformations vs actual rendering
   - Optimize based on measurements

## Related Decisions

- [TODO-099: Refactor CodeBlock Extras to Arrays](../todos/099-refactor-codeblock-extras-to-arrays.md) - Example application of this principle
- [ADR-001: Source-Based Development](001-source-based-development.md) - Similar principle of optimizing developer workflow

## References

- V8 Performance Tips: https://v8.dev/blog/elements-kinds
- JavaScript Array Performance: https://v8.dev/blog/fast-properties
- Rendering Performance: https://web.dev/rendering-performance/
