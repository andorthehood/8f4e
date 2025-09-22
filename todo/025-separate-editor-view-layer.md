# TODO: Separate Editor View Layer into Standalone Package

**Priority**: 🟡
**Estimated Effort**: 3-5 days
**Created**: 2025-08-26
**Status**: Open

The current editor package tightly couples the state management logic with browser-specific rendering code. The `packages/editor/src/view/` directory contains:
- Canvas-based rendering using HTML5 Canvas
- Sprite generation and texture management
- Browser-specific drawing operations
- Direct coupling with the 2D engine and sprite generator

This coupling makes the editor package non-portable and difficult to integrate with alternative rendering engines (e.g., terminal-based, server-side, or other graphics APIs).

## Proposed Solution

Extract the view layer into a separate `@8f4e/browser-view` package that:
- Defines a clean interface for rendering operations
- Implements the current browser-based renderer as one implementation
- Allows the core editor to remain a pure state machine
- Enables future renderer implementations without modifying core logic

The editor package should become a pure state machine that can be coupled with any compatible renderer implementation.

## Implementation Plan

### Step 1: Create View Interface Package
- Create new `packages/browser-view/` package
- Define `Renderer` interface with methods like `drawCodeBlocks()`, `drawConnections()`, `resize()`, etc.
- Extract view-related types and interfaces
- Expected outcome: Clean separation of concerns with well-defined contracts

### Step 2: Extract Current View Implementation
- Move `packages/editor/src/view/` to `packages/browser-view/src/`
- Refactor to implement the new `Renderer` interface
- Update imports and dependencies
- Expected outcome: Browser renderer as first implementation

### Step 3: Refactor Editor Package
- Remove view dependencies from editor package
- Inject renderer instance through constructor/options
- Ensure editor only manages state and emits events
- Expected outcome: Editor becomes pure state machine

### Step 4: Update Integration Points
- Modify editor initialization to accept renderer
- Update tests to use mock renderers
- Ensure backward compatibility
- Expected outcome: Seamless integration with new architecture

## Success Criteria

- [ ] Editor package has no direct view dependencies
- [ ] View package implements clean renderer interface
- [ ] Editor can be initialized with different renderer implementations
- [ ] All existing functionality preserved
- [ ] Tests pass with both real and mock renderers

## Affected Components

- `packages/editor/` - Remove view dependencies, inject renderer
- `packages/editor/src/view/` - Move to new package
- `packages/editor/src/index.ts` - Update initialization
- `src/editor.ts` - Update to use new renderer injection

## Risks & Considerations

- **Breaking Changes**: Editor initialization API will change
- **Performance**: Additional abstraction layer may impact performance
- **Dependencies**: Need to carefully manage package dependencies
- **Migration**: Existing code using editor will need updates

## Related Items

- **Blocks**: None currently
- **Depends on**: None
- **Related**: May enable future renderer implementations (terminal, server-side, etc.)

## References

- Current view implementation: `packages/editor/src/view/`
- State types: `packages/editor/src/state/types.ts`
- 2D Engine dependency: `packages/2d-engine/`
- Sprite Generator: `packages/sprite-generator/`

## Notes

- This refactor aligns with the goal of making the editor more portable
- Consider creating a simple mock renderer for testing
- May want to implement a basic terminal renderer as proof of concept
- The renderer interface should be designed to support both immediate and retained mode rendering

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
