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
	function onMouseDown({ x, y }: InternalMouseEvent) {
		if (!state.featureFlags.moduleDragging) {
			return;
		}

		state.graphicHelper.draggedCodeBlock = findCodeBlockAtViewportCoordinates(state, x, y);
		const draggedCodeBlock = state.graphicHelper.draggedCodeBlock;

		if (!draggedCodeBlock) {
			return;
		}
		state.graphicHelper.selectedCodeBlock = state.graphicHelper.draggedCodeBlock;

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
		if (state.graphicHelper.draggedCodeBlock) {
			state.graphicHelper.draggedCodeBlock.x += movementX;
			state.graphicHelper.draggedCodeBlock.y += movementY;
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (!state.graphicHelper.draggedCodeBlock) {
			return;
		}

		// Compute grid coordinates from pixel position
		const gridX = Math.round(state.graphicHelper.draggedCodeBlock.x / state.viewport.vGrid);
		const gridY = Math.round(state.graphicHelper.draggedCodeBlock.y / state.viewport.hGrid);

		// Update grid coordinates and recompute snapped pixel coordinates
		state.graphicHelper.draggedCodeBlock.gridX = gridX;
		state.graphicHelper.draggedCodeBlock.gridY = gridY;
		state.graphicHelper.draggedCodeBlock.x = gridX * state.viewport.vGrid;
		state.graphicHelper.draggedCodeBlock.y = gridY * state.viewport.hGrid;

		state.graphicHelper.draggedCodeBlock = undefined;
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
