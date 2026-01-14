# Demo Mode Feature

## Purpose

Provides a presentation mode for showcasing code blocks in the editor. Automatically cycles through blocks at timed intervals, highlighting each one in sequence. This feature is intended for demonstrations and algorave performances.

🎪 **Dev-Only**: This feature is for demonstration purposes and is not intended for production user workflows.

## Key Behaviors

- **Random Initialization**: Randomly selects a starting block on initialization
- **Timed Navigation**: Automatically advances to the next block at configured intervals
- **Sequential Progression**: Navigates through blocks in sequence based on `creationIndex`
- **Selection Update**: Updates the selected block as it navigates

## Events & Callbacks

### Events Listened To

- Demo mode is triggered through state configuration or manual activation
- Navigation timing is controlled internally

### State Touched

- `state.graphicHelper.selectedCodeBlock` - Updates to highlight the current block
- `state.graphicHelper.codeBlocks` - Source of blocks to cycle through

## Integration Points

- **Code Blocks**: Navigates through the code block collection
- **Viewport**: May trigger viewport centering on selected blocks (implementation-dependent)

## Notes & Limitations

- **Dev-Only Feature**: Not intended for regular editing workflows
- Random selection provides variety in demo sequences
- Timing intervals are fixed in implementation
- Useful for algorave performances where automatic code display is desired
