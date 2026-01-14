# Menu Feature

## Purpose

Manages context menu interactions in the editor: opening menus, highlighting options, and dispatching actions. Provides the event flow for contextual actions on code blocks and editor elements.

## Key Behaviors

- **Menu Opening**: Displays context menus at specified screen positions
- **Option Highlighting**: Tracks which menu option is currently highlighted (hover/keyboard navigation)
- **Action Dispatch**: Executes menu actions when options are selected
- **State Management**: Maintains menu state (open/closed, position, highlighted option)

## Events & Callbacks

### Events Listened To

- Menu open events (with position and context data)
- Menu highlight events (option selection)
- Menu action events (action execution)
- Menu close events

### State Touched

- `state.menu.isOpen` - Boolean indicating if menu is currently displayed
- `state.menu.position` - Screen coordinates for menu placement
- `state.menu.highlightedOption` - Currently highlighted menu option
- `state.menu.context` - Contextual data for menu (e.g., selected block)

## Integration Points

- **Code Blocks**: Context menus for block operations (duplicate, delete, etc.)
- **Viewport**: Menu positioning relative to viewport coordinates
- **UI Layer**: Menu rendering and interaction handling

## Menu Contents

Menu contents and available actions are built dynamically based on context. This feature provides the infrastructure but does not enumerate specific menu items.

See `menus/` subdirectory for menu construction logic.

## Notes & Limitations

- Menu state is ephemeral (not persisted)
- Menu contents depend on context (selected block, viewport state, etc.)
- Position coordinates are in screen/pixel space
- Keyboard navigation support depends on UI layer implementation
