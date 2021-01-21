const moduleDragger = function (state, events) {
	let draggedModule = null;

	const onMouseDown = ({ x, y }) => {
		draggedModule = state.ui.modules.find(module => {
			const { width, height } = state.ui.moduleTypes[module.type];
			return (
				x >= module.x + state.ui.viewport.x &&
				x <= module.x + width + state.ui.viewport.x &&
				y >= module.y + state.ui.viewport.y &&
				y <= module.y + height + state.ui.viewport.y
			);
		});

		if (draggedModule) {
			draggedModule.beingDragged = true;
			draggedModule.isSelected = true;
		}
	};

	const onMouseMove = event => {
		const { movementX, movementY } = event;
		if (draggedModule) {
			draggedModule.x += movementX;
			draggedModule.y += movementY;
			event.stopPropagation = true;
		}
	};

	const onMouseUp = () => {
		if (draggedModule) {
			draggedModule.beingDragged = false;
			draggedModule.x = Math.round(draggedModule.x / 10) * 10;
			draggedModule.y = Math.round(draggedModule.y / 10) * 10;
			draggedModule = null;
		}

		localStorage.setItem('ui', JSON.stringify(state.ui));
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
