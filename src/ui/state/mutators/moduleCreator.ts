const moduleCreator = function (state, events) {
	const onAddModule = ({ x, y }) => {
		console.log('add module', x, y);

		state.ui.modules.push({
			position: [x - state.ui.offset[0], y - state.ui.offset[1]],
			size: [100, 100],
			name: 'Test',
			id: state.ui.modules.length,
		});
	};

	const onDeleteModule = ({ module }) => {
		console.log('ezt torli', module);
		state.ui.modules.splice(module, 1);
	};

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
};

export default moduleCreator;
