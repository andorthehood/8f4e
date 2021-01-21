const connectionMaker = function (state, events) {
	const onMouseMove = ({ x, y }) => {
		state.ui.connectionPointB = [x, y];
	};

	const onMouseDown = event => {
		const { x, y } = event;

		const module = state.ui.modules.find(module => {
			const { width, height } = state.ui.moduleTypes[module.type];
			return (
				x >= module.x + state.ui.viewport.x &&
				x <= module.x + width + state.ui.viewport.x &&
				y >= module.y + state.ui.viewport.y &&
				y <= module.y + height + state.ui.viewport.y
			);
		});

		if (!module) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connector = Object.keys(state.ui.moduleTypes[module.type].connectors).find(id => {
			const connector = state.ui.moduleTypes[module.type].connectors[id];
			return (
				x >= module.x + state.ui.viewport.x + connector.x &&
				x <= module.x + 10 + state.ui.viewport.x + connector.x &&
				y >= module.y + state.ui.viewport.y + connector.y &&
				y <= module.y + 10 + state.ui.viewport.y + connector.y
			);
		});

		if (!connector) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		if (state.ui.isConnectionBeingMade) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			state.ui.connections.push({
				fromModule: state.ui.connectionFromModule,
				fromConnector: state.ui.connectionFromConnector,
				toModule: module.id,
				toConnector: connector,
			});
			return;
		}

		event.stopPropagation = true;
		state.ui.connectionPointA = [x, y];
		state.ui.connectionPointB = [x, y];
		state.ui.connectionFromModule = module.id;
		state.ui.connectionFromConnector = connector;
		state.ui.isConnectionBeingMade = true;
		events.on('mousemove', onMouseMove);
	};

	const onDeleteConnection = ({ moduleId }) => {
		state.ui.connections = state.ui.connections.filter(({ fromModule, toModule }) => {
			return moduleId !== fromModule && moduleId !== toModule;
		});
	};

	events.on('deleteConnection', onDeleteConnection);
	events.on('mousedown', onMouseDown);
};

export default connectionMaker;
