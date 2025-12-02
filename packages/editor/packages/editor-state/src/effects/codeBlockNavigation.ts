import findClosestCodeBlockInDirection, { Direction } from '../pureHelpers/finders/findClosestCodeBlockInDirection';
import centerViewportOnCodeBlock from '../pureHelpers/centerViewportOnCodeBlock';

import type { State, EventDispatcher, InternalKeyboardEvent } from '../types';

/**
 * Navigates to a code block in the specified direction.
 * This is a reusable helper that handles both keyboard and automated navigation.
 *
 * @param state - The editor state
 * @param direction - The direction to navigate
 * @returns {boolean} true if navigation to a different block occurred, false if no block is selected or the target is the same as the current block
 */
export function navigateToCodeBlockInDirection(state: State, direction: Direction): boolean {
	// Only proceed if a code block is currently selected
	if (!state.graphicHelper.selectedCodeBlock) {
		return false;
	}

	// Get the current viewport's code blocks
	const codeBlocks = state.graphicHelper.codeBlocks;
	const currentBlock = state.graphicHelper.selectedCodeBlock;

	// Find the closest code block in the specified direction
	const targetBlock = findClosestCodeBlockInDirection(codeBlocks, currentBlock, direction);

	// If we found a different block, select it and center viewport on it
	if (targetBlock !== currentBlock) {
		state.graphicHelper.selectedCodeBlock = targetBlock;
		// Enable animation for this programmatic viewport change, but restore original value after
		const originalViewportAnimations = state.featureFlags.viewportAnimations;
		state.featureFlags.viewportAnimations = true;
		centerViewportOnCodeBlock(state.graphicHelper.viewport, targetBlock);
		state.featureFlags.viewportAnimations = originalViewportAnimations;
		return true;
	}

	return false;
}

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

		navigateToCodeBlockInDirection(state, direction);
	};

	// Register the keyboard event handler
	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
