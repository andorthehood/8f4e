const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y }) => {
		const id1 = Date.now() + 1;
		const id2 = Date.now() + 2;
		state.ui.modules.push({
			x: x - state.ui.viewport.x,
			y: y - state.ui.viewport.y,
			id: 'quantizer' + Date.now(),
			type: 'quantizer',
		});
	};

	const onDeleteModule = ({ moduleId }) => {
		state.ui.modules.splice(
			state.ui.modules.findIndex(({ id }) => id === moduleId),
			1
		);
		events.dispatch('deleteConnection', { moduleId });
	};

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
};

export default moduleCreator;
