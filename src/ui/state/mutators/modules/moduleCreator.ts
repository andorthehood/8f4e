const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y }) => {
		const id1 = Date.now() + 1;
		const id2 = Date.now() + 2;
		state.ui.modules.push({
			position: [x - state.ui.viewport.x, y - state.ui.viewport.y],
			size: [100, 100],
			name: 'Test',
			id: 'splitter' + Date.now(),
			type: 'splitter',
			connectors: { [id1]: { name: 'connector', x: 5, y: 20 }, [id2]: { name: 'connector2', x: 5, y: 35 } },
		});
	};

	const onDeleteModule = ({ moduleId }) => {
		state.ui.modules.splice(
			state.ui.modules.findIndex(({ id }) => id === moduleId),
			1
		);
		events.dispatch('onDeleteConnection', { moduleId });
	};

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
};

export default moduleCreator;
