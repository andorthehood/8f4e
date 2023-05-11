import { EventDispatcher } from '../../../events';
import { HGRID, VGRID } from '../../../view/drawers/consts';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { ModuleGraphicData, State } from '../../types';

export default function moduleDragger(state: State, events: EventDispatcher): () => void {
	let draggedModule: ModuleGraphicData | undefined = undefined;
	let startingPosition: { x: number; y: number } | undefined;
	function onMouseDown({ x, y }) {
		draggedModule = findModuleAtViewportCoordinates(state.graphicHelper, state.project.viewport, x, y);

		if (!draggedModule) {
			return;
		}
		state.selectedModule = draggedModule;
		startingPosition = { x: draggedModule.x, y: draggedModule.y };

		const relativeX = Math.abs(x - (state.project.viewport.x + draggedModule.x));
		const relativeY = Math.abs(y - (state.project.viewport.y + draggedModule.y));
		events.dispatch('moduleClick', { x, y, relativeX, relativeY, module: draggedModule });

		// Bring dragged module forward.
		state.graphicHelper.modules.delete(draggedModule);
		state.graphicHelper.modules.add(draggedModule);
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
		if (!draggedModule) {
			return;
		}
		draggedModule.x = Math.round(draggedModule.x / VGRID) * VGRID;
		draggedModule.y = Math.round(draggedModule.y / HGRID) * HGRID;

		if (startingPosition?.x !== draggedModule.x || startingPosition?.y !== draggedModule.y) {
			events.dispatch('saveState');
		}

		draggedModule = undefined;
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
