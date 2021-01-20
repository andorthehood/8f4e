const connectionMaker = function (state, events) {
	const onMouseMove = ({ x, y }) => {
		state.ui.connectionPointB = [x, y];
	};

	const onMouseDown = event => {
		const { x, y } = event;

		const module = state.ui.modules.find(
			({ position, size }) =>
				x >= position[0] + state.ui.viewport.x &&
				x <= position[0] + size[0] + state.ui.viewport.x &&
				y >= position[1] + state.ui.viewport.y &&
				y <= position[1] + size[1] + state.ui.viewport.y
		);

		if (!module) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connector = Object.keys(module.connectors).find(id => {
			const connector = module.connectors[id];
			return (
				x >= module.position[0] + state.ui.viewport.x + connector.x &&
				x <= module.position[0] + 10 + state.ui.viewport.x + connector.x &&
				y >= module.position[1] + state.ui.viewport.y + connector.y &&
				y <= module.position[1] + 10 + state.ui.viewport.y + connector.y
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
		state.ui.connections.splice(
			state.ui.connections.findIndex(({ fromModule, toModule }) => moduleId === fromModule || moduleId === toModule),
			1
		);
	};

	events.on('deleteConnection', onDeleteConnection);
	events.on('mousedown', onMouseDown);
};

export default connectionMaker;
