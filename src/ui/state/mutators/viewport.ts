const viewport = function (state, events) {
	const onMouseMove = event => {
		if (event.buttons === 1) {
			state.ui.offset[0] += event.movementX;
			state.ui.offset[1] += event.movementY;
		}
	};

	const onResize = () => {
		state.ui.viewport.width = window.innerWidth;
		state.ui.viewport.height = window.innerHeight;
	};

	onResize();

	events.on('mousemove', onMouseMove);
	events.on('resize', onResize);

	return () => {
		events.off('mousemove', onMouseMove);
		events.off('resize', onResize);
	};
};

export default viewport;
