---
title: 'TODO: Separate Editor User Interactions into Standalone Package'
priority: Medium
effort: 2-3 days
created: 2025-08-26
status: Completed
completed: null
---

# TODO: Separate Editor User Interactions into Standalone Package

The current editor package tightly couples user interaction handling with the core state management logic. The `packages/editor/src/events/` and various interaction effects contain:
- Browser-specific event listeners (mouse, keyboard, wheel)
- DOM event handling and coordinate calculations
- Direct coupling with HTML elements and browser APIs
- Complex interaction logic mixed with state management

This coupling makes the editor package non-portable and difficult to integrate with alternative input systems (e.g., terminal-based, server-side, or other UI frameworks).

## Proposed Solution

Extract the user interaction layer into a separate `@8f4e/browser-input` package that:
- Defines a clean, device-agnostic interface for input events
- Implements the current browser-based input handling as one implementation
- Allows the core editor to remain a pure state machine
- Enables future input implementations (touch, joystick, etc.) without modifying core logic

The editor package should become a pure state machine that can be coupled with any compatible input system implementation.

## Implementation Plan

### Step 1: Create Input Interface Package
- Create new `packages/browser-input/` package
- Define `InputHandler` interface with device-agnostic methods like `onPointerEvent()`, `onKeyEvent()`, etc.
- Extract input-related types and interfaces
- Expected outcome: Clean separation of concerns with well-defined contracts

### Step 2: Extract Current Input Implementation
- Move `packages/editor/src/events/` to `packages/browser-input/src/`
- Move interaction effects (codeBlockDragger, viewport, contextMenu, etc.) to input package
- Refactor to implement the new `InputHandler` interface
- Expected outcome: Browser input handler as first implementation

### Step 3: Refactor Editor Package
- Remove input dependencies from editor package
- Inject input handler instance through constructor/options
- Ensure editor only manages state and emits events
- Expected outcome: Editor becomes pure state machine

### Step 4: Update Integration Points
- Modify editor initialization to accept input handler
- Update tests to use mock input handlers
- Ensure backward compatibility
- Expected outcome: Seamless integration with new architecture

## Success Criteria

- [ ] Editor package has no direct input dependencies
- [ ] Input package implements clean handler interface
- [ ] Editor can be initialized with different input implementations
- [ ] All existing interaction functionality preserved
- [ ] Tests pass with both real and mock input handlers

## Affected Components

- `packages/editor/` - Remove input dependencies, inject input handler
- `packages/editor/src/events/` - Move to new package
- `packages/editor/src/state/effects/` - Move interaction effects to input package
- `packages/editor/src/state/index.ts` - Update initialization
- `packages/editor/src/index.ts` - Update to use new input handler injection
- `src/editor.ts` - Update to use new input handler injection

## Risks & Considerations

- **Breaking Changes**: Editor initialization API will change
- **Event System**: Need to carefully manage event dispatching between packages
- **Dependencies**: Need to carefully manage package dependencies
- **Testing**: More complex testing setup with input handler injection
- **Migration**: Existing code using editor will need updates

## Related Items

- **Blocks**: None currently
- **Depends on**: May benefit from completing TODO-025 (separate view layer) first
- **Related**: Enables future input implementations (terminal, server-side, touch, joystick, etc.)

## References

- Current events system: `packages/editor/src/events/`
- Interaction effects: `packages/editor/src/state/effects/`
- Human interface: `packages/editor/src/events/humanInterface.ts`
- State initialization: `packages/editor/src/state/index.ts`

## Notes

- This refactor aligns with the goal of making the editor more portable
- Consider creating a simple mock input handler for testing
- May want to implement a basic terminal input handler as proof of concept
- The input handler interface should be designed to support both immediate and event-driven input models
- Need to carefully consider how events flow between the input package and editor state
- **Device Agnostic Design**: Interface methods should use generic names like `onPointerEvent()` instead of `onMouseEvent()` to support future devices (touch, joystick, etc.)
- **Input Abstraction**: Consider abstracting coordinates, buttons, and movements in a device-independent way

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
