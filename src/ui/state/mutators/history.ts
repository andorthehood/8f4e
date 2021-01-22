const history = function (state, events) {
	const onHistoricEvent = () => {
		state.history.push({
			modules: [...state.ui.modules],
			connections: [...state.ui.connections],
		});
	};

	const onUndo = () => {
		const prevState = state.history.pop();

		if (!prevState) {
			return;
		}

		const { modules, connections } = prevState;
		state.ui.modules = modules;
		state.ui.connections = connections;
	};

	events.on('deleteConnection', onHistoricEvent);
	events.on('createConnection', onHistoricEvent);
	events.on('deleteModule', onHistoricEvent);
	events.on('addModule', onHistoricEvent);
	events.on('undo', onUndo);
};

export default history;
