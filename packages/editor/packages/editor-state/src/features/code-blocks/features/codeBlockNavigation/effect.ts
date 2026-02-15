import findClosestCodeBlockInDirection, { Direction } from '../../utils/finders/findClosestCodeBlockInDirection';
import centerViewportOnCodeBlock from '../../../viewport/centerViewportOnCodeBlock';

import type { State, EventDispatcher, NavigateCodeBlockEvent } from '~/types';

/**
 * Event payload for jumping to a favorite code block.
 */
interface JumpToFavoriteCodeBlockEvent {
	/** Primary identifier: stable runtime creationIndex */
	creationIndex: number;
	/** Fallback identifier: source code block ID */
	id: string;
}

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
		centerViewportOnCodeBlock(state.viewport, targetBlock);
		state.featureFlags.viewportAnimations = originalViewportAnimations;
		return true;
	}

	return false;
}

/**
 * Jumps to a specific code block by its identifiers.
 *
 * Resolves the target block using creationIndex (primary) or id (fallback).
 * If the block is found, selects it and centers the viewport on it.
 *
 * @param state - The editor state
 * @param creationIndex - The stable runtime identifier of the target block
 * @param id - The source code ID of the target block (fallback)
 * @returns {boolean} true if the block was found and jumped to, false otherwise
 */
export function jumpToCodeBlock(state: State, creationIndex: number, id: string): boolean {
	const codeBlocks = state.graphicHelper.codeBlocks;

	// Try to resolve by creationIndex first (primary identifier)
	let targetBlock = codeBlocks.find(block => block.creationIndex === creationIndex);

	// Fallback to resolving by id if creationIndex didn't match
	if (!targetBlock) {
		targetBlock = codeBlocks.find(block => block.id === id);
	}

	// If we found a block, select it and center viewport on it
	if (targetBlock) {
		state.graphicHelper.selectedCodeBlock = targetBlock;
		// Enable animation for this programmatic viewport change, but restore original value after
		const originalViewportAnimations = state.featureFlags.viewportAnimations;
		state.featureFlags.viewportAnimations = true;
		centerViewportOnCodeBlock(state.viewport, targetBlock);
		state.featureFlags.viewportAnimations = originalViewportAnimations;
		return true;
	}

	// Block not found - no-op
	return false;
}

/**
 * Code block directional navigation effect.
 *
 * Listens for navigateCodeBlock events to enable navigation between code blocks.
 * When a navigateCodeBlock event is received with a direction,
 * this effect will:
 * - Find the closest code block in the specified direction
 * - Select that code block
 * - Center the viewport on the newly selected block
 *
 * If no code block is selected, the effect does nothing.
 *
 * Also listens for jumpToFavoriteCodeBlock events to enable jumping to specific
 * code blocks by creationIndex/id. When a jumpToFavoriteCodeBlock event is received,
 * this effect will:
 * - Resolve the target block by creationIndex (primary) or id (fallback)
 * - Select that code block
 * - Center the viewport on the newly selected block
 *
 * @param state - The editor state
 * @param events - The event dispatcher
 */
export default function codeBlockNavigation(state: State, events: EventDispatcher): void {
	const onNavigateCodeBlock = (event: NavigateCodeBlockEvent) => {
		navigateToCodeBlockInDirection(state, event.direction);
	};

	const onJumpToFavoriteCodeBlock = (event: JumpToFavoriteCodeBlockEvent) => {
		jumpToCodeBlock(state, event.creationIndex, event.id);
	};

	// Register the abstract navigation event handler
	events.on<NavigateCodeBlockEvent>('navigateCodeBlock', onNavigateCodeBlock);
	events.on<JumpToFavoriteCodeBlockEvent>('jumpToFavoriteCodeBlock', onJumpToFavoriteCodeBlock);
}
