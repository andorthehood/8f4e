# Code Editing Feature

## Purpose

Handles low-level text editing operations within code blocks: caret movement, character insertion, deletion, and newline operations. Manages cursor position and line mapping through gap buffer calculations.

## Key Behaviors

- **Caret Movement**: Arrow key navigation (up, down, left, right) with line wrapping
- **Text Insertion**: Single character and multi-character text insertion at cursor position
- **Deletion**: Backspace operation with line merging
- **Newline**: Enter key handling with line splitting
- **Gap Calculations**: Computes cursor position adjustments based on line length and content
- **Syntax Highlighting Context**: Determines whether to use 8f4e or GLSL syntax highlighting based on block type

## Events & Callbacks

### Events Listened To

- `moveCaret` - Handles arrow key navigation with direction parameter
- `deleteBackward` - Backspace key handler
- `insertNewLine` - Enter key handler
- `insertText` - Text input handler with text payload

### State Touched

- `state.graphicHelper.selectedCodeBlock.code` - Array of code lines
- `state.graphicHelper.selectedCodeBlock.cursor.row` - Current cursor row (line number)
- `state.graphicHelper.selectedCodeBlock.cursor.col` - Current cursor column position
- `state.graphicHelper.selectedCodeBlock.lastUpdated` - Timestamp of last edit
- `state.editorMode` - Global editor mode (`view`, `edit`, or `presentation`)
- `state.featureFlags.editing` - Enables text-editing operations
- `state.featureFlags.codeLineSelection` - Enables caret movement within selected code blocks

## Integration Points

- **Code Blocks**: Works on the currently selected code block
- **Edit History**: Code changes trigger debounced history snapshots
- **Syntax Highlighting**: Block type determines GLSL vs 8f4e highlighting mode
  - `vertexShader` and `fragmentShader` blocks use GLSL syntax
  - All other blocks use 8f4e syntax

## Notes & Limitations

- Text insertion, deletion, and newline operations check `state.featureFlags.editing` before executing
- Caret movement checks `state.featureFlags.codeLineSelection` before executing
- `editor-mode` transitions currently toggle both flags when entering or leaving edit mode
- Editing requires a selected code block
- Gap calculations handle edge cases like line wrapping and cursor bounds
- Line and column indices are 0-based internally
