# Code Blocks Feature

## Purpose

Manages the lifecycle of code blocks in the editor: creation, selection, drag operations, deletion, and visual representation. Code blocks are the primary building blocks of 8f4e programs, containing code and metadata that determine how they are compiled and rendered.

## Key Behaviors

- **Block Lifecycle**: Creates, updates, and deletes code blocks
- **Selection**: Tracks which block is currently selected for editing
- **Drag Operations**: Handles repositioning blocks in the viewport
- **Graphics Derivation**: Computes visual properties (position, size, color) from block data
- **Block Extras**: Derives interactive elements from code annotations:
  - Inputs/Outputs for audio routing
  - Buttons and Switches for interactive controls
  - Piano keyboard for MIDI input
  - Debuggers for runtime inspection
  - Plotters for visualization

## Block Types

Code blocks are categorized by type, which determines compilation and rendering behavior:

- **`module`** - Top-level code modules compiled as standalone units
- **`function`** - Function definitions compiled separately
- **`constants`** - Constant definitions (compiled as modules)
- **`config`** - Stack-based configuration blocks (see config-compiler feature)
- **`vertexShader`** - GLSL vertex shader code
- **`fragmentShader`** - GLSL fragment shader code
- **`unknown`** - Unclassified blocks (fallback)

Block types are automatically detected and updated based on code content.

## Subfeatures

This feature contains several subfeatures under `features/` that handle specific aspects:

- `blockHighlights` - Visual highlighting for selected/hovered blocks
- `blockTypeUpdater` - Automatic block type detection and updates
- `bufferPlotters` - Visualization of runtime buffer data
- `buttons` - Interactive button controls derived from code
- `codeBlockCreator` - Block creation logic
- `codeBlockDragger` - Drag and drop operations
- `codeBlockNavigation` - Keyboard navigation between blocks
- `debuggers` - Runtime debugging overlays
- `graphicHelper` - Visual properties computation
- `inputs` - Audio input routing
- `outputs` - Audio output routing
- `pianoKeyboard` - MIDI keyboard interface
- `switches` - Toggle switch controls

## Events & Callbacks

### Key Events

- Block creation, deletion, and selection events
- Drag start/update/end events
- Block type update events

### State Touched

- `state.graphicHelper.codeBlocks` - Array of all code blocks with their visual and code data
- `state.graphicHelper.selectedCodeBlock` - Currently selected block reference
- Block-specific properties: position, size, color, blockType, code, cursor, extras (inputs/outputs/buttons/switches)

## Integration Points

- **Compiler**: Blocks are sorted by `creationIndex` and filtered by type for compilation
- **Config Compiler**: Config blocks are collected and compiled separately
- **Shader Effects**: Shader blocks feed into post-process effect generation
- **Viewport**: Block positions are in viewport coordinates
- **Edit History**: Block changes trigger history snapshots

## References

- See `utils/` for block manipulation helpers
- See `features/` subdirectories for detailed subfeature implementations
- See `../../../../../docs/editor-directives.md` for editor-only directive syntax (`; @...`) and supported directives
