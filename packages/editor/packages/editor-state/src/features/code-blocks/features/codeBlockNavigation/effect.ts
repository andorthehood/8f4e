import type { Direction, EventDispatcher, NavigateCodeBlockEvent, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import gapCalculator from '../../../code-editing/gapCalculator';
import reverseGapCalculator from '../../../code-editing/reverseGapCalculator';
import animateViewport from '../../../viewport/animateViewport';
import centerViewportOnCodeBlock from '../../../viewport/centerViewportOnCodeBlock';
import centerViewportOnCodeBlockCursor from '../../../viewport/centerViewportOnCodeBlockCursor';
import findClosestCodeBlockInDirection from '../../utils/finders/findClosestCodeBlockInDirection';
import { deriveDirectiveState } from '../directives/registry';

type StateSource = StateManager<State> | State;
type CodeBlockCursor = NonNullable<State['codeBlockRendering']['selectedCodeBlock']>['cursor'];
type CodeBlockCursorUpdate = Partial<CodeBlockCursor> & Pick<CodeBlockCursor, 'row' | 'col'>;

function getState(source: StateSource): State {
	return 'getState' in source ? source.getState() : source;
}

function setSelectedCodeBlock(source: StateSource, codeBlock: State['codeBlockRendering']['selectedCodeBlock']): void {
	if ('set' in source) {
		source.set('codeBlockRendering.selectedCodeBlock', codeBlock);
		return;
	}

	source.codeBlockRendering.selectedCodeBlock = codeBlock;
}

function setSelectedCodeBlockCursor(
	source: StateSource,
	block: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>,
	cursor: CodeBlockCursorUpdate
): void {
	const nextCursor = {
		...block.cursor,
		...cursor,
	};

	if ('set' in source && getState(source).codeBlockRendering.selectedCodeBlock === block) {
		source.set('codeBlockRendering.selectedCodeBlock.cursor', nextCursor);
		return;
	}

	block.cursor = nextCursor;
}

function alignTargetBlockCursorForHorizontalNavigation(
	source: StateSource,
	sourceBlock: State['codeBlockRendering']['selectedCodeBlock'],
	targetBlock: State['codeBlockRendering']['selectedCodeBlock']
): void {
	if (!sourceBlock || !targetBlock) {
		return;
	}

	const state = getState(source);
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

	setSelectedCodeBlockCursor(source, targetBlock, {
		row: targetRawRow,
		col: Math.min(sourceBlock.cursor.col, targetBlock.code[targetRawRow]?.length ?? 0),
		y: gapCalculator(boundedDisplayRow, targetBlock.gaps) * state.viewport.hGrid,
	});
}

function setBlockCursorToDisplayRow(
	source: StateSource,
	block: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>,
	displayRow: number,
	sourceCol?: number
): void {
	const state = getState(source);
	const directiveState = deriveDirectiveState(block.code, block.parsedDirectives, {
		isExpandedForEditing: true,
	});
	const maxDisplayRow = Math.max(directiveState.displayModel.displayRowToRawRow.length - 1, 0);
	const boundedDisplayRow = Math.min(Math.max(displayRow, 0), maxDisplayRow);
	const targetRawRow = directiveState.displayModel.displayRowToRawRow[boundedDisplayRow] ?? 0;

	setSelectedCodeBlockCursor(source, block, {
		row: targetRawRow,
		col: Math.min(sourceCol ?? block.cursor.col, block.code[targetRawRow]?.length ?? 0),
		y: gapCalculator(boundedDisplayRow, block.gaps) * state.viewport.hGrid,
	});
}

function getSelectedBlockDisplayRow(
	state: State,
	block: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>
): number {
	const physicalRow = Math.max(Math.floor(block.cursor.y / state.viewport.hGrid), 0);
	return reverseGapCalculator(physicalRow, block.gaps);
}

function moveSelectionToCurrentBlockVerticalEdge(
	source: StateSource,
	block: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>,
	direction: 'up' | 'down'
): boolean {
	const state = getState(source);
	const directiveState = deriveDirectiveState(block.code, block.parsedDirectives, {
		isExpandedForEditing: true,
	});
	const maxDisplayRow = Math.max(directiveState.displayModel.displayRowToRawRow.length - 1, 0);
	const currentDisplayRow = getSelectedBlockDisplayRow(state, block);
	const edgeDisplayRow = direction === 'up' ? 0 : maxDisplayRow;

	if (currentDisplayRow === edgeDisplayRow) {
		return false;
	}

	setBlockCursorToDisplayRow(source, block, edgeDisplayRow);
	return true;
}

function alignTargetBlockCursorForVerticalNavigation(
	source: StateSource,
	sourceBlock: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>,
	targetBlock: NonNullable<State['codeBlockRendering']['selectedCodeBlock']>,
	direction: 'up' | 'down'
): void {
	const targetDirectiveState = deriveDirectiveState(targetBlock.code, targetBlock.parsedDirectives, {
		isExpandedForEditing: true,
	});
	const maxDisplayRow = Math.max(targetDirectiveState.displayModel.displayRowToRawRow.length - 1, 0);
	const targetDisplayRow = direction === 'up' ? maxDisplayRow : 0;

	setBlockCursorToDisplayRow(source, targetBlock, targetDisplayRow, sourceBlock.cursor.col);
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
	if (!state.codeBlockRendering.selectedCodeBlock) {
		return false;
	}

	// Get the current viewport's code blocks
	const codeBlocks = state.codeBlockRendering.codeBlocks;
	const currentBlock = state.codeBlockRendering.selectedCodeBlock;

	// Find the closest code block in the specified direction
	if (
		(direction === 'up' || direction === 'down') &&
		moveSelectionToCurrentBlockVerticalEdge(stateSource, currentBlock, direction)
	) {
		const { x, y } = centerViewportOnCodeBlockCursor(state.viewport, currentBlock);
		animateViewport(state, x, y, events);
		return true;
	}

	const targetBlock = findClosestCodeBlockInDirection(codeBlocks, currentBlock, direction);

	// If we found a different block, select it and center viewport on it
	if (targetBlock !== currentBlock) {
		setSelectedCodeBlock(stateSource, targetBlock);

		if (direction === 'left' || direction === 'right') {
			alignTargetBlockCursorForHorizontalNavigation(stateSource, currentBlock, targetBlock);
		} else {
			alignTargetBlockCursorForVerticalNavigation(stateSource, currentBlock, targetBlock, direction);
		}

		const { x, y } = centerViewportOnCodeBlockCursor(state.viewport, targetBlock);
		animateViewport(state, x, y, events);
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
	const codeBlocks = state.codeBlockRendering.codeBlocks;

	// Try to resolve by creationIndex first (primary identifier)
	let targetBlock = codeBlocks.find(block => block.creationIndex === creationIndex);

	// Fallback to resolving by id if creationIndex didn't match
	if (!targetBlock) {
		targetBlock = codeBlocks.find(block => block.id === id);
	}

	// If we found a block, select it and center viewport on it
	if (targetBlock) {
		setSelectedCodeBlock(stateSource, targetBlock);
		const { x, y } = centerViewportOnCodeBlockCursor(state.viewport, targetBlock);
		animateViewport(state, x, y, events);
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
	const homeBlock = state.codeBlockRendering.codeBlocks.find(block => block.isHome);

	if (homeBlock) {
		setSelectedCodeBlock(stateSource, homeBlock);
		const { x, y } = centerViewportOnCodeBlock(state.viewport, homeBlock, {
			alignment: homeBlock.homeAlignment,
		});
		animateViewport(state, x, y, events);
	} else {
		animateViewport(state, 0, 0, events);
	}
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
