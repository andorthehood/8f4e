const moduleDragger = function (state, events) {
	let draggedModule = null;

	const onMouseDown = e => {
		const x = e.clientX;
		const y = e.clientY;

		draggedModule = state.ui.modules.find(
			({ position, size }) =>
				x >= position[0] + state.ui.offset[0] &&
				x <= position[0] + size[0] + state.ui.offset[0] &&
				y >= position[1] + state.ui.offset[1] &&
				y <= position[1] + size[1] + state.ui.offset[1]
		);

		if (draggedModule) {
			draggedModule.beingDragged = true;
			draggedModule.isSelected = true;
		}
	};

	const onMouseMove = e => {
		const x = e.clientX;
		const y = e.clientY;
		if (draggedModule) {
			draggedModule.position[0] += e.movementX;
			draggedModule.position[1] += e.movementY;
			e.stopPropagation = true;
		}
	};

	const onMouseUp = e => {
		if (draggedModule) {
			draggedModule.beingDragged = false;
			draggedModule.position[0] = Math.round(draggedModule.position[0] / 10) * 10;
			draggedModule.position[1] = Math.round(draggedModule.position[1] / 10) * 10;
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
