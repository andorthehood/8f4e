import { EventDispatcher } from '../../../events';
import { HGRID, VGRID } from '../../../view/drawers/consts';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { Module, State } from '../../types';

export default function moduleDragger(state: State, events: EventDispatcher): () => void {
	let draggedModule: Module | undefined = undefined;

	function onMouseDown({ x, y }) {
		draggedModule = findModuleAtViewportCoordinates(state.graphicHelper, state.project.viewport, x, y);

		state.selectedModule = draggedModule;

		if (draggedModule) {
			events.dispatch('moduleClick', { x, y, module: draggedModule });

			// Bring dragged module forward.
			state.project.modules.push(state.project.modules.splice(state.project.modules.indexOf(draggedModule), 1)[0]);
		}
	}

	function onMouseMove(event) {
		const { movementX, movementY } = event;
		if (draggedModule) {
			draggedModule.x += movementX;
			draggedModule.y += movementY;
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (draggedModule) {
			draggedModule.x = Math.round(draggedModule.x / (VGRID * 2)) * (VGRID * 2);
			draggedModule.y = Math.round(draggedModule.y / HGRID) * HGRID;
			draggedModule = undefined;
		}

		events.dispatch('saveState');
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
