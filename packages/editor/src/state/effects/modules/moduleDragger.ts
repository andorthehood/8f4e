import { EventDispatcher } from '../../../events';
import { HGRID, VGRID } from '../../../view/drawers/consts';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { State } from '../../types';

export default function moduleDragger(state: State, events: EventDispatcher): () => void {
	let startingPosition: { x: number; y: number } | undefined;
	function onMouseDown({ x, y }) {
		state.graphicHelper.draggedModule = findModuleAtViewportCoordinates(
			state.graphicHelper,
			state.project.viewport,
			x,
			y
		);

		if (!state.graphicHelper.draggedModule) {
			return;
		}
		state.selectedModule = state.graphicHelper.draggedModule;
		startingPosition = { x: state.graphicHelper.draggedModule.x, y: state.graphicHelper.draggedModule.y };

		const relativeX = Math.abs(x - (state.project.viewport.x + state.graphicHelper.draggedModule.x));
		const relativeY = Math.abs(y - (state.project.viewport.y + state.graphicHelper.draggedModule.y));
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
		state.graphicHelper.draggedModule.x = Math.round(state.graphicHelper.draggedModule.x / VGRID) * VGRID;
		state.graphicHelper.draggedModule.y = Math.round(state.graphicHelper.draggedModule.y / HGRID) * HGRID;

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
