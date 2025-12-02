import { EventDispatcher } from '../../types';
import { InternalMouseEvent } from '../../types';
import findCodeBlockAtViewportCoordinates from '../../helpers/findCodeBlockAtViewportCoordinates';

import type { CodeBlockGraphicData, State } from '../../types';

export interface CodeBlockClickEvent {
	x: number;
	y: number;
	relativeX: number;
	relativeY: number;
	codeBlock: CodeBlockGraphicData;
}

export default function codeBlockDragger(state: State, events: EventDispatcher): () => void {
	function onMouseDown({ x, y }: InternalMouseEvent) {
		if (!state.featureFlags.moduleDragging) {
			return;
		}

		state.graphicHelper.draggedCodeBlock = findCodeBlockAtViewportCoordinates(state.graphicHelper, x, y);
		const draggedCodeBlock = state.graphicHelper.draggedCodeBlock;

		if (!draggedCodeBlock) {
			return;
		}
		state.graphicHelper.selectedCodeBlock = state.graphicHelper.draggedCodeBlock;

		const relativeX = Math.abs(x - (draggedCodeBlock.x + draggedCodeBlock.offsetX - state.graphicHelper.viewport.x));
		const relativeY = Math.abs(y - (draggedCodeBlock.y + draggedCodeBlock.offsetY - state.graphicHelper.viewport.y));

		events.dispatch<CodeBlockClickEvent>('codeBlockClick', {
			x,
			y,
			relativeX,
			relativeY,
			codeBlock: draggedCodeBlock,
		});

		// Bring dragged module forward.
		state.graphicHelper.codeBlocks.delete(draggedCodeBlock);
		state.graphicHelper.codeBlocks.add(draggedCodeBlock);
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

		// Snap to grid by rounding pixel coordinates
		state.graphicHelper.draggedCodeBlock.x =
			Math.round(state.graphicHelper.draggedCodeBlock.x / state.graphicHelper.viewport.vGrid) *
			state.graphicHelper.viewport.vGrid;
		state.graphicHelper.draggedCodeBlock.y =
			Math.round(state.graphicHelper.draggedCodeBlock.y / state.graphicHelper.viewport.hGrid) *
			state.graphicHelper.viewport.hGrid;

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
