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

		// Find the closest code block in the specified direction
		const targetBlock = findClosestCodeBlockInDirection(codeBlocks, currentBlock, direction);

		// If we found a different block, select it and center viewport on it
		if (targetBlock !== currentBlock) {
			state.graphicHelper.selectedCodeBlock = targetBlock;
			centerViewportOnCodeBlock(
				state.graphicHelper.activeViewport.viewport,
				targetBlock,
				state.graphicHelper.globalViewport
			);
		}
	};

	// Register the keyboard event handler
	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
