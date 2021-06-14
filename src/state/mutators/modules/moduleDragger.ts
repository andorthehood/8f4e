import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { State } from '../../types';

export default function moduleDragger(state: State, events): () => void {
	let draggedModule = null;

	function onMouseDown({ x, y }) {
		draggedModule = findModuleAtViewportCoordinates(state.modules, state.moduleTypes, state.viewport, x, y);
		if (draggedModule) {
			events.dispatch('moduleClick', { x, y, module: draggedModule });
			draggedModule.beingDragged = true;
			draggedModule.isSelected = true;

			// Bring dragged module forward.
			state.modules.push(state.modules.splice(state.modules.indexOf(draggedModule), 1)[0]);
		}
	}

	function onMouseMove(event) {
		const { movementX, movementY } = event;
		if (draggedModule) {
			draggedModule.x += movementX;
			draggedModule.y += movementY;
			draggedModule.row = Math.round(draggedModule.y / state.viewport.hGrid);
			draggedModule.col = Math.round(draggedModule.x / state.viewport.vGrid);
			event.stopPropagation = true;
		}
	}

	function onMouseUp() {
		if (draggedModule) {
			draggedModule.beingDragged = false;
			draggedModule.x = Math.round(draggedModule.x / 10) * 10;
			draggedModule.y = Math.round(draggedModule.y / 10) * 10;
			draggedModule.row = Math.round(draggedModule.y / state.viewport.hGrid);
			draggedModule.col = Math.round(draggedModule.x / state.viewport.vGrid);
			draggedModule = null;
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
