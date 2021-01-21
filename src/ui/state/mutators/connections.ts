import findModuleAtViewportCoordinates from '../helpers/findModuleAtViewportCoordinates';
import findConnectorAtViewportCoordinates from '../helpers/findConnectorAtViewportCoordinates';

const connectionMaker = function (state, events) {
	const onMouseMove = event => {
		const { x, y } = event;
		state.ui.connectionPointB = [x, y];
		event.stopPropagation = true;
	};

	const onMouseUp = event => {
		const { x, y } = event;

		const module = findModuleAtViewportCoordinates(state, x, y);

		if (!module) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connector = findConnectorAtViewportCoordinates(state, module, x, y);

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
	events.on('mouseup', onMouseUp);
};

export default connectionMaker;
