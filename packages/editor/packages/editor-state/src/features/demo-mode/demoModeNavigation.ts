import { navigateToCodeBlockInDirection } from '../code-blocks/features/codeBlockNavigation/effect';
import centerViewportOnCodeBlock from '../viewport/centerViewportOnCodeBlock';

import type { State, EventDispatcher } from '~/types';
import type { Direction } from '../code-blocks/utils/finders/findClosestCodeBlockInDirection';

/**
 * Selects a random code block from the available code blocks.
 *
 * @param state - The editor state
 * @returns true if a block was selected, false otherwise
 */
function selectRandomCodeBlock(state: State): boolean {
	const codeBlocks = state.graphicHelper.codeBlocks;

	if (codeBlocks.length === 0) {
		return false;
	}

	// Select a random code block
	const randomIndex = Math.floor(Math.random() * codeBlocks.length);
	const selectedBlock = codeBlocks[randomIndex];

	state.graphicHelper.selectedCodeBlock = selectedBlock;

	centerViewportOnCodeBlock(state.graphicHelper.viewport, selectedBlock);

	return true;
}

/**
 * Demo mode navigation effect.
 *
 * Enables automatic navigation between code blocks for presentation purposes.
 * When demo mode is enabled, this effect:
 * - Automatically selects a random code block on initialization
 * - Navigates between code blocks every 2 seconds in random directions
 *
 * @param state - The editor state
 * @param events - The event dispatcher
 * @returns Cleanup function to clear interval and unregister event handler
 */
export default function demoModeNavigation(state: State, events: EventDispatcher): () => void {
	if (!state.featureFlags.demoMode) {
		return () => {}; // Return no-op cleanup function
	}

	let demoInterval: ReturnType<typeof setInterval> | null = null;

	// Initialize demo mode on project load
	const onInit = () => {
		// Clear any existing interval
		if (demoInterval) {
			clearInterval(demoInterval);
			demoInterval = null;
		}

		// Select a random code block if none is selected
		if (!state.graphicHelper.selectedCodeBlock) {
			selectRandomCodeBlock(state);
		}

		// Start the demo navigation interval
		demoInterval = setInterval(() => {
			// Check if we still have code blocks available
			if (state.graphicHelper.codeBlocks.length === 0) {
				return;
			}

			// Select a random direction
			const directions: Direction[] = ['left', 'right', 'up', 'down'];
			const randomDirection = directions[Math.floor(Math.random() * directions.length)];

			// Navigate in that direction
			navigateToCodeBlockInDirection(state, randomDirection);
		}, 2000); // 2 second cadence
	};

	events.on('init', onInit);

	return () => {
		if (demoInterval) {
			clearInterval(demoInterval);
		}
		events.off('init', onInit);
	};
}
