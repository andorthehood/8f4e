import { EventDispatcher } from '../../../events';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { State } from '../../types';

export default function moduleDragger(state: State, events: EventDispatcher): () => void {
	let startingPosition: { x: number; y: number } | undefined;
	function onMouseDown({ x, y }) {
		state.graphicHelper.draggedModule = findModuleAtViewportCoordinates(state.graphicHelper, x, y);

		if (!state.graphicHelper.draggedModule) {
			return;
		}
		state.graphicHelper.selectedModule = state.graphicHelper.draggedModule;
		startingPosition = {
			x: state.graphicHelper.draggedModule.x,
			y: state.graphicHelper.draggedModule.y,
		};

		const relativeX = Math.abs(
			x -
				(state.graphicHelper.draggedModule.x +
					state.graphicHelper.draggedModule.offsetX -
					state.graphicHelper.viewport.x)
		);
		const relativeY = Math.abs(
			y -
				(state.graphicHelper.draggedModule.y +
					state.graphicHelper.draggedModule.offsetY -
					state.graphicHelper.viewport.y)
		);
		events.dispatch('moduleClick', { x, y, relativeX, relativeY, module: state.graphicHelper.draggedModule });

		// Bring dragged module forward.
		state.graphicHelper.modules.delete(state.graphicHelper.draggedModule);
		state.graphicHelper.modules.add(state.graphicHelper.draggedModule);
	}

	function onMouseMove(event) {
		const { movementX, movementY } = event;
		if (state.graphicHelper.draggedModule) {
			state.graphicHelper.draggedModule.x += movementX;
			state.graphicHelper.draggedModule.y += movementY;
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (!state.graphicHelper.draggedModule) {
			return;
		}

		state.graphicHelper.draggedModule.gridX = Math.round(
			state.graphicHelper.draggedModule.x / state.graphicHelper.viewport.vGrid
		);
		state.graphicHelper.draggedModule.gridY = Math.round(
			state.graphicHelper.draggedModule.y / state.graphicHelper.viewport.hGrid
		);

		state.graphicHelper.draggedModule.x =
			Math.round(state.graphicHelper.draggedModule.x / state.graphicHelper.viewport.vGrid) *
			state.graphicHelper.viewport.vGrid;
		state.graphicHelper.draggedModule.y =
			Math.round(state.graphicHelper.draggedModule.y / state.graphicHelper.viewport.hGrid) *
			state.graphicHelper.viewport.hGrid;

		if (
			startingPosition?.x !== state.graphicHelper.draggedModule.x ||
			startingPosition?.y !== state.graphicHelper.draggedModule.y
		) {
			events.dispatch('saveState');
		}

		state.graphicHelper.draggedModule = undefined;
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
