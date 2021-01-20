const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y }) => {
		const id1 = Date.now() + 1;
		const id2 = Date.now() + 2;
		state.ui.modules.push({
			position: [x - state.ui.viewport.x, y - state.ui.viewport.y],
			size: [100, 100],
			name: 'Test',
			id: 'lfo' + Date.now(),
			type: 'lfo',
			connectors: { [id1]: { name: 'connector', x: 5, y: 20 }, [id2]: { name: 'connector2', x: 5, y: 35 } },
		});
	};

	const onDeleteModule = ({ module }) => {
		state.ui.modules.splice(module, 1);
	};

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
};

export default moduleCreator;
