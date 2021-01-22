import findModuleAtViewportCoordinates from '../helpers/findModuleAtViewportCoordinates';
import findConnectorAtViewportCoordinates from '../helpers/findConnectorAtViewportCoordinates';
import findConnectorInModule from '../helpers/findConnectorInModule';
import findConnectionByConnector from '../helpers/findConnectionByConnector';

const connectionMaker = function (state, events) {
	const onMouseMove = event => {
		state.ui.connectionPointB = [event.x, event.y];
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

		const connection = findConnectionByConnector(state, module, connector);

		if (!state.ui.isConnectionBeingMade && connection) {
			return events.dispatch('deleteConnection', { connectionId: connection.id });
		}

		if (state.ui.isConnectionBeingMade && connection) {
			if (connection) {
				return events.dispatch('error', { message: `This connector is already connected.` });
			}
		}

		if (state.ui.isConnectionBeingMade) {
			state.ui.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);

			const connectorToConnect = findConnectorInModule(
				state,
				state.ui.connectionFromModule,
				state.ui.connectionFromConnector
			);

			if (connector.isInput && connectorToConnect.isInput) {
				return events.dispatch('error', { message: `It doesn't make sense to connect two inputs` });
			}

			if (!connector.isInput && !connectorToConnect.isInput) {
				return events.dispatch('error', { message: `It doesn't make sense to connect two outputs` });
			}

			events.dispatch('createConnection', { module, connector });
			return;
		}

		state.ui.connectionPointA = [x, y];
		state.ui.connectionPointB = [x, y];
		state.ui.connectionFromModule = module.id;
		state.ui.connectionFromConnector = connector.id;
		state.ui.isConnectionBeingMade = true;
		events.on('mousemove', onMouseMove);
	};

	const onDeleteConnection = ({ moduleId, connectionId }) => {
		state.ui.connections = state.ui.connections.filter(({ fromModule, toModule, id }) => {
			return !(connectionId === id || moduleId === fromModule || moduleId === toModule);
		});
	};

	const onCreateConnection = ({ module, connector }) => {
		state.ui.connections.push({
			fromModule: state.ui.connectionFromModule,
			fromConnector: state.ui.connectionFromConnector,
			toModule: module.id,
			toConnector: connector.id,
			id: Date.now(),
		});
	};

	events.on('deleteConnection', onDeleteConnection);
	events.on('mouseup', onMouseUp);
	events.on('createConnection', onCreateConnection);
};

export default connectionMaker;
