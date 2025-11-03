import findClosestCodeBlockInDirection, { Direction } from '../helpers/findClosestCodeBlockInDirection';
import centerViewportOnCodeBlock from '../helpers/centerViewportOnCodeBlock';

import type { State, EventDispatcher, InternalKeyboardEvent } from '../types';

/**
 * Code block directional navigation effect.
 *
 * Enables navigation between code blocks using Command/Ctrl + Arrow keys.
 * When a code block is selected and the user presses Command + arrow key,
 * this effect will:
 * - Find the closest code block in the specified direction
 * - Select that code block
 * - Center the viewport on the newly selected block
 *
 * If no code block is selected, the effect does nothing.
 *
 * @param state - The editor state
 * @param events - The event dispatcher
 */
export default function codeBlockNavigation(state: State, events: EventDispatcher): void {
	const onKeydown = (event: InternalKeyboardEvent) => {
		// Only handle Command/Ctrl + arrow key combinations
		if (!event.metaKey) {
			return;
		}

		// Only proceed if a code block is currently selected
		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		// Map arrow keys to directions
		let direction: Direction | null = null;
		switch (event.key) {
			case 'ArrowLeft':
				direction = 'left';
				break;
			case 'ArrowRight':
				direction = 'right';
				break;
			case 'ArrowUp':
				direction = 'up';
				break;
			case 'ArrowDown':
				direction = 'down';
				break;
			default:
				// Not an arrow key, ignore
				return;
		}

		// Get the current viewport's code blocks
		const codeBlocks = state.graphicHelper.activeViewport.codeBlocks;
		const currentBlock = state.graphicHelper.selectedCodeBlock;

		// Enrich the current block with cursor Y for horizontal navigation
		const enrichedCurrentBlock = { ...currentBlock, cursorY: currentBlock.cursor.y };

		// Find the closest code block in the specified direction
		const targetBlock = findClosestCodeBlockInDirection(codeBlocks, enrichedCurrentBlock, direction);

		// If we found a different block (comparing by reference to the original blocks in the set)
		// Note: targetBlock might be enrichedCurrentBlock if no candidates found, so we check against codeBlocks
		const actualTargetBlock = Array.from(codeBlocks).find(
			block => block.x === targetBlock.x && block.y === targetBlock.y && block.id === targetBlock.id
		);

		if (actualTargetBlock && actualTargetBlock !== currentBlock) {
			state.graphicHelper.selectedCodeBlock = actualTargetBlock;
			// Enable animation for this programmatic viewport change
			state.featureFlags.viewportAnimations = true;
			centerViewportOnCodeBlock(
				state.graphicHelper.activeViewport.viewport,
				actualTargetBlock,
				state.graphicHelper.globalViewport
			);
		}
	};

	// Register the keyboard event handler
	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
