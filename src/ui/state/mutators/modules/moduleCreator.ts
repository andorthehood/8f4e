const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y, type }) => {
		state.ui.modules.push({
			x: x - state.ui.viewport.x - Math.floor(state.ui.moduleTypes[type].width / 2),
			y: y - state.ui.viewport.y - Math.floor(state.ui.moduleTypes[type].height / 2),
			id: type + Date.now(),
			type,
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
