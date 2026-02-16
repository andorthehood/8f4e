import findCodeBlockAtViewportCoordinates from '../../utils/finders/findCodeBlockAtViewportCoordinates';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, InternalMouseEvent, EventDispatcher } from '~/types';

export interface CodeBlockClickEvent {
	x: number;
	y: number;
	relativeX: number;
	relativeY: number;
	codeBlock: CodeBlockGraphicData;
}

export default function codeBlockDragger(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	// dragSet holds the blocks being dragged together. It's computed fresh on each mousedown
	// and cleared on mouseup, so concurrent drags are not a concern (only one drag at a time).
	let dragSet: CodeBlockGraphicData[] = [];

	function onMouseDown(event: InternalMouseEvent) {
		const { x, y, altKey } = event;
		if (!state.featureFlags.moduleDragging) {
			return;
		}

		state.graphicHelper.draggedCodeBlock = findCodeBlockAtViewportCoordinates(state, x, y);
		const draggedCodeBlock = state.graphicHelper.draggedCodeBlock;

		if (!draggedCodeBlock) {
			return;
		}
		state.graphicHelper.selectedCodeBlock = state.graphicHelper.draggedCodeBlock;

		// Compute drag set based on modifier and group
		if (altKey && draggedCodeBlock.groupName) {
			// Grouped drag: include all blocks with matching group name
			dragSet = state.graphicHelper.codeBlocks.filter(block => block.groupName === draggedCodeBlock.groupName);
		} else {
			// Single block drag
			dragSet = [draggedCodeBlock];
		}

		const relativeX = Math.abs(x - (draggedCodeBlock.x + draggedCodeBlock.offsetX - state.viewport.x));
		const relativeY = Math.abs(y - (draggedCodeBlock.y + draggedCodeBlock.offsetY - state.viewport.y));

		events.dispatch<CodeBlockClickEvent>('codeBlockClick', {
			x,
			y,
			relativeX,
			relativeY,
			codeBlock: draggedCodeBlock,
		});

		// Bring dragged module forward.
		state.graphicHelper.codeBlocks = [
			...state.graphicHelper.codeBlocks.filter(block => block !== draggedCodeBlock),
			draggedCodeBlock,
		];
	}

	function onMouseMove(event: InternalMouseEvent) {
		const { movementX, movementY } = event;
		if (state.graphicHelper.draggedCodeBlock && dragSet.length > 0) {
			// Apply movement to all blocks in drag set
			for (const block of dragSet) {
				block.x += movementX;
				block.y += movementY;
			}
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (!state.graphicHelper.draggedCodeBlock || dragSet.length === 0) {
			return;
		}

		// Snap all blocks in drag set to grid
		for (const block of dragSet) {
			const gridX = Math.round(block.x / state.viewport.vGrid);
			const gridY = Math.round(block.y / state.viewport.hGrid);
			block.gridX = gridX;
			block.gridY = gridY;
			block.x = gridX * state.viewport.vGrid;
			block.y = gridY * state.viewport.hGrid;
		}

		state.graphicHelper.draggedCodeBlock = undefined;
		dragSet = [];
	}

	events.on('mousedown', onMouseDown);
	events.on('mousemove', onMouseMove);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		events.off('mouseup', onMouseUp);
	};
}
