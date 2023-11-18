import { EventDispatcher } from '../../../events';
import findCodeBlockAtViewportCoordinates from '../../helpers/findCodeBlockAtViewportCoordinates';
import { State } from '../../types';

export default function codeBlockDragger(state: State, events: EventDispatcher): () => void {
	let startingPosition: { x: number; y: number } | undefined;
	function onMouseDown({ x, y }) {
		state.graphicHelper.draggedCodeBlock = findCodeBlockAtViewportCoordinates(state.graphicHelper, x, y);

		if (!state.graphicHelper.draggedCodeBlock) {
			return;
		}
		state.graphicHelper.selectedCodeBlock = state.graphicHelper.draggedCodeBlock;
		startingPosition = {
			x: state.graphicHelper.draggedCodeBlock.x,
			y: state.graphicHelper.draggedCodeBlock.y,
		};

		const relativeX = Math.abs(
			x -
				(state.graphicHelper.draggedCodeBlock.x +
					state.graphicHelper.draggedCodeBlock.offsetX -
					state.graphicHelper.activeViewport.viewport.x)
		);
		const relativeY = Math.abs(
			y -
				(state.graphicHelper.draggedCodeBlock.y +
					state.graphicHelper.draggedCodeBlock.offsetY -
					state.graphicHelper.activeViewport.viewport.y)
		);
		events.dispatch('codeBlockClick', { x, y, relativeX, relativeY, codeBlock: state.graphicHelper.draggedCodeBlock });

		// Bring dragged module forward.
		state.graphicHelper.activeViewport.codeBlocks.delete(state.graphicHelper.draggedCodeBlock);
		state.graphicHelper.activeViewport.codeBlocks.add(state.graphicHelper.draggedCodeBlock);
	}

	function onMouseMove(event) {
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

		state.graphicHelper.draggedCodeBlock.gridX = Math.round(
			state.graphicHelper.draggedCodeBlock.x / state.graphicHelper.globalViewport.vGrid
		);
		state.graphicHelper.draggedCodeBlock.gridY = Math.round(
			state.graphicHelper.draggedCodeBlock.y / state.graphicHelper.globalViewport.hGrid
		);

		state.graphicHelper.draggedCodeBlock.x =
			Math.round(state.graphicHelper.draggedCodeBlock.x / state.graphicHelper.globalViewport.vGrid) *
			state.graphicHelper.globalViewport.vGrid;
		state.graphicHelper.draggedCodeBlock.y =
			Math.round(state.graphicHelper.draggedCodeBlock.y / state.graphicHelper.globalViewport.hGrid) *
			state.graphicHelper.globalViewport.hGrid;

		if (
			startingPosition?.x !== state.graphicHelper.draggedCodeBlock.x ||
			startingPosition?.y !== state.graphicHelper.draggedCodeBlock.y
		) {
			events.dispatch('saveState');
		}

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
