import findClosestCodeBlockInDirection from '../../utils/finders/findClosestCodeBlockInDirection';
import { deriveDirectiveState } from '../directives/registry';
import centerViewportOnCodeBlockCursor from '../../../viewport/centerViewportOnCodeBlockCursor';
import gapCalculator from '../../../code-editing/gapCalculator';
import reverseGapCalculator from '../../../code-editing/reverseGapCalculator';

import type { Direction } from '../../utils/types';
import type { StateManager } from '@8f4e/state-manager';
import type { State, EventDispatcher, NavigateCodeBlockEvent } from '~/types';

type StateSource = StateManager<State> | State;

function getState(source: StateSource): State {
	return 'getState' in source ? source.getState() : source;
}

function setSelectedCodeBlock(source: StateSource, codeBlock: State['graphicHelper']['selectedCodeBlock']): void {
	if ('set' in source) {
		source.set('graphicHelper.selectedCodeBlock', codeBlock);
		return;
	}

	source.graphicHelper.selectedCodeBlock = codeBlock;
}

function alignTargetBlockCursorForHorizontalNavigation(
	state: State,
	sourceBlock: State['graphicHelper']['selectedCodeBlock'],
	targetBlock: State['graphicHelper']['selectedCodeBlock']
): void {
	if (!sourceBlock || !targetBlock) {
		return;
	}

	const sourceAbsoluteCursorY = sourceBlock.y + sourceBlock.offsetY + sourceBlock.cursor.y;
	const targetRelativeCursorY = sourceAbsoluteCursorY - (targetBlock.y + targetBlock.offsetY);
	const targetPhysicalRow = Math.max(Math.floor(targetRelativeCursorY / state.viewport.hGrid), 0);
	const targetDirectiveState = deriveDirectiveState(targetBlock.code, targetBlock.parsedDirectives, {
		isExpandedForEditing: true,
	});
	const targetDisplayRow = reverseGapCalculator(targetPhysicalRow, targetBlock.gaps);
	const boundedDisplayRow = Math.min(
		Math.max(targetDisplayRow, 0),
		Math.max(targetDirectiveState.displayModel.displayRowToRawRow.length - 1, 0)
	);
	const targetRawRow = targetDirectiveState.displayModel.displayRowToRawRow[boundedDisplayRow] ?? 0;

	targetBlock.cursor.row = targetRawRow;
	targetBlock.cursor.col = Math.min(sourceBlock.cursor.col, targetBlock.code[targetRawRow]?.length ?? 0);
	targetBlock.cursor.y = gapCalculator(boundedDisplayRow, targetBlock.gaps) * state.viewport.hGrid;
}

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
export function navigateToCodeBlockInDirection(
	stateSource: StateSource,
	direction: Direction,
	events?: EventDispatcher
): boolean {
	const state = getState(stateSource);
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
		if (direction === 'left' || direction === 'right') {
			alignTargetBlockCursorForHorizontalNavigation(state, currentBlock, targetBlock);
		}

		setSelectedCodeBlock(stateSource, targetBlock);
		centerViewportOnCodeBlockCursor(state.viewport, targetBlock);
		events?.dispatch('viewportMoved');
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
export function jumpToCodeBlock(
	stateSource: StateSource,
	creationIndex: number,
	id: string,
	events?: EventDispatcher
): boolean {
	const state = getState(stateSource);
	const codeBlocks = state.graphicHelper.codeBlocks;

	// Try to resolve by creationIndex first (primary identifier)
	let targetBlock = codeBlocks.find(block => block.creationIndex === creationIndex);

	// Fallback to resolving by id if creationIndex didn't match
	if (!targetBlock) {
		targetBlock = codeBlocks.find(block => block.id === id);
	}

	// If we found a block, select it and center viewport on it
	if (targetBlock) {
		setSelectedCodeBlock(stateSource, targetBlock);
		centerViewportOnCodeBlockCursor(state.viewport, targetBlock);
		events?.dispatch('viewportMoved');
		return true;
	}

	// Block not found - no-op
	return false;
}

/**
 * Centers the viewport on the first @home code block, or defaults to origin.
 *
 * Selects the first code block with isHome=true (regardless of disabled state),
 * centers the viewport on it. If no home block exists, centers the viewport at (0,0).
 *
 * @param state - The editor state
 */
export function goHome(stateSource: StateSource, events?: EventDispatcher): void {
	const state = getState(stateSource);
	const homeBlock = state.graphicHelper.codeBlocks.find(block => block.isHome);

	if (homeBlock) {
		setSelectedCodeBlock(stateSource, homeBlock);
		centerViewportOnCodeBlockCursor(state.viewport, homeBlock);
	} else {
		state.viewport.x = 0;
		state.viewport.y = 0;
	}

	events?.dispatch('viewportMoved');
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
export default function codeBlockNavigation(store: StateManager<State>, events: EventDispatcher): void {
	const onNavigateCodeBlock = (event: NavigateCodeBlockEvent) => {
		navigateToCodeBlockInDirection(store, event.direction, events);
	};

	const onJumpToFavoriteCodeBlock = (event: JumpToFavoriteCodeBlockEvent) => {
		jumpToCodeBlock(store, event.creationIndex, event.id, events);
	};

	const onGoHome = () => {
		goHome(store, events);
	};

	// Register the abstract navigation event handler
	events.on<NavigateCodeBlockEvent>('navigateCodeBlock', onNavigateCodeBlock);
	events.on<JumpToFavoriteCodeBlockEvent>('jumpToFavoriteCodeBlock', onJumpToFavoriteCodeBlock);
	events.on('goHome', onGoHome);
}
