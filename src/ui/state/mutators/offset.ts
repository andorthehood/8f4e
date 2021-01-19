const offset = function (state, events) {
	const onMouseMove = event => {
		if (event.buttons === 1) {
			state.ui.offset[0] += event.movementX;
			state.ui.offset[1] += event.movementY;
		}
	};

	events.on('mousemove', onMouseMove);

	return () => {
		events.off('mousemove', onMouseMove);
	};
};

export default offset;
