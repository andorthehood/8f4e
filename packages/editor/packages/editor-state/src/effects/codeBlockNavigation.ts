import findClosestCodeBlockInDirection, { Direction } from '../helpers/findClosestCodeBlockInDirection';
import centerViewportOnCodeBlock from '../helpers/centerViewportOnCodeBlock';

import type { State, EventDispatcher, InternalKeyboardEvent } from '../types';

/**
 * Navigates to a code block in the specified direction.
 * This is a reusable helper that handles both keyboard and automated navigation.
 *
 * @param state - The editor state
 * @param direction - The direction to navigate
 * @returns true if navigation occurred, false otherwise
 */
function navigateToCodeBlockInDirection(state: State, direction: Direction): boolean {
	// Only proceed if a code block is currently selected
	if (!state.graphicHelper.selectedCodeBlock) {
		return false;
	}

	// Get the current viewport's code blocks
	const codeBlocks = state.graphicHelper.activeViewport.codeBlocks;
	const currentBlock = state.graphicHelper.selectedCodeBlock;

	// Find the closest code block in the specified direction
	const targetBlock = findClosestCodeBlockInDirection(codeBlocks, currentBlock, direction);

	// If we found a different block, select it and center viewport on it
	if (targetBlock !== currentBlock) {
		state.graphicHelper.selectedCodeBlock = targetBlock;
		// Enable animation for this programmatic viewport change
		state.featureFlags.viewportAnimations = true;
		centerViewportOnCodeBlock(
			state.graphicHelper.activeViewport.viewport,
			targetBlock,
			state.graphicHelper.globalViewport
		);
		return true;
	}

	return false;
}

/**
 * Selects a random code block from the available code blocks.
 *
 * @param state - The editor state
 * @returns true if a block was selected, false otherwise
 */
function selectRandomCodeBlock(state: State): boolean {
	const codeBlocks = Array.from(state.graphicHelper.activeViewport.codeBlocks);

	if (codeBlocks.length === 0) {
		return false;
	}

	// Select a random code block
	const randomIndex = Math.floor(Math.random() * codeBlocks.length);
	const selectedBlock = codeBlocks[randomIndex];

	state.graphicHelper.selectedCodeBlock = selectedBlock;
	// Enable animation for this programmatic viewport change
	state.featureFlags.viewportAnimations = true;
	centerViewportOnCodeBlock(
		state.graphicHelper.activeViewport.viewport,
		selectedBlock,
		state.graphicHelper.globalViewport
	);

	return true;
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
 * When demo mode is enabled, this effect also:
 * - Automatically selects a random code block on initialization
 * - Navigates between code blocks every 2 seconds in random directions
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

	// Demo mode: automatically navigate between code blocks
	if (state.featureFlags.demoMode) {
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
				if (state.graphicHelper.activeViewport.codeBlocks.size === 0) {
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
	}
}
