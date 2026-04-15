import { StateManager } from '@8f4e/state-manager';

import { resolveViewportAnchoredPosition } from './resolve';

import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

function syncViewportAnchoredBlockList(state: State): void {
	state.graphicHelper.viewportAnchoredCodeBlocks = state.graphicHelper.codeBlocks.filter(
		block => block.viewportAnchor !== undefined
	);
}

function syncViewportAnchoredBlock(state: State, block: CodeBlockGraphicData | undefined): void {
	if (!block) {
		return;
	}

	const anchoredBlocks = state.graphicHelper.viewportAnchoredCodeBlocks;
	const existingIndex = anchoredBlocks.indexOf(block);

	if (block.viewportAnchor) {
		if (existingIndex === -1) {
			anchoredBlocks.push(block);
		}
		return;
	}

	if (existingIndex !== -1) {
		anchoredBlocks.splice(existingIndex, 1);
	}
}

function recomputeViewportAnchoredPositions(state: State): void {
	for (const codeBlock of state.graphicHelper.viewportAnchoredCodeBlocks) {
		recomputeViewportAnchoredPosition(state, codeBlock);
	}
}

function recomputeViewportAnchoredPosition(state: State, block: CodeBlockGraphicData | undefined): void {
	if (!block || !block.viewportAnchor || block === state.graphicHelper.draggedCodeBlock) {
		return;
	}

	const pos = resolveViewportAnchoredPosition({
		anchor: block.viewportAnchor,
		posX: block.gridX,
		posY: block.gridY,
		viewportX: state.viewport.x,
		viewportY: state.viewport.y,
		viewportWidth: state.viewport.roundedWidth,
		viewportHeight: state.viewport.roundedHeight,
		blockWidth: block.width,
		blockHeight: block.height,
		vGrid: state.viewport.vGrid,
		hGrid: state.viewport.hGrid,
	});
	block.x = pos.x;
	block.y = pos.y;
}

export default function viewportDirectiveEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	const syncAllBlocks = () => {
		syncViewportAnchoredBlockList(state);
		recomputeViewportAnchoredPositions(state);
	};

	const syncSelectedCodeBlock = () => {
		syncViewportAnchoredBlock(state, state.graphicHelper.selectedCodeBlock);
		recomputeViewportAnchoredPosition(state, state.graphicHelper.selectedCodeBlock);
	};

	const syncProgrammaticSelectedCodeBlock = () => {
		syncViewportAnchoredBlock(state, state.graphicHelper.selectedCodeBlockForProgrammaticEdit);
		recomputeViewportAnchoredPosition(state, state.graphicHelper.selectedCodeBlockForProgrammaticEdit);
	};

	const syncProgrammaticSelectedCodeBlockWithoutCompilerTrigger = () => {
		syncViewportAnchoredBlock(state, state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger);
		recomputeViewportAnchoredPosition(
			state,
			state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger
		);
	};

	const recomputeAnchoredPositions = () => {
		recomputeViewportAnchoredPositions(state);
	};

	store.subscribe('graphicHelper.codeBlocks', syncAllBlocks);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', syncProgrammaticSelectedCodeBlock);
	store.subscribe(
		'graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		syncProgrammaticSelectedCodeBlockWithoutCompilerTrigger
	);
	events.on('spriteSheetRerendered', recomputeAnchoredPositions);
	events.on('viewportChanged', recomputeAnchoredPositions);
	events.on('viewportResized', recomputeAnchoredPositions);
}
