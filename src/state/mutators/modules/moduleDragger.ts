import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';

const moduleDragger = function (state, events) {
	let draggedModule = null;

	const onMouseDown = ({ x, y }) => {
		draggedModule = findModuleAtViewportCoordinates(state.ui, x, y);
		if (draggedModule) {
			events.dispatch('moduleClick', { x, y, module: draggedModule });
			draggedModule.beingDragged = true;
			draggedModule.isSelected = true;

			// Bring dragged module forward.
			state.ui.modules.push(state.ui.modules.splice(state.ui.modules.indexOf(draggedModule), 1)[0]);
		}
	};

	const onMouseMove = event => {
		const { movementX, movementY } = event;
		if (draggedModule) {
			draggedModule.x += movementX;
			draggedModule.y += movementY;
			draggedModule.row = Math.round(draggedModule.y / state.ui.viewport.hGrid);
			draggedModule.col = Math.round(draggedModule.x / state.ui.viewport.vGrid);
			event.stopPropagation = true;
		}
	};

	const onMouseUp = () => {
		if (draggedModule) {
			draggedModule.beingDragged = false;
			draggedModule.x = Math.round(draggedModule.x / 10) * 10;
			draggedModule.y = Math.round(draggedModule.y / 10) * 10;
			draggedModule.row = Math.round(draggedModule.y / state.ui.viewport.hGrid);
			draggedModule.col = Math.round(draggedModule.x / state.ui.viewport.vGrid);
			draggedModule = null;
		}

		events.dispatch('saveState');
	};

	events.on('mousedown', onMouseDown);
	events.on('mousemove', onMouseMove);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		events.off('mouseup', onMouseUp);
	};
};

export default moduleDragger;
