import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import findConnectorAtViewportCoordinates from '../../helpers/findConnectorAtViewportCoordinates';
import findConnectorInModule from '../../helpers/findConnectorInModule';
import { rejectConnectionByConnectorId, findConnectionByConnectorId } from '../../helpers/connectionHelpers';

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

		const connection = findConnectionByConnectorId(state.ui.connections, module.id, connector.id);

		if (!state.ui.isConnectionBeingMade && connection) {
			return events.dispatch('deleteConnection', { connectorId: connector.id, moduleId: module.id });
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

			if (state.ui.connectionFromModule === module.id) {
				return events.dispatch('error', { message: `Self-patching is not supported` });
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

	const onDeleteConnection = ({ moduleId, connectorId }) => {
		state.ui.connections = rejectConnectionByConnectorId(state.ui.connections, moduleId, connectorId);
	};

	const onCreateConnection = ({ module, connector }) => {
		state.ui.connections.push([
			{
				connectorId: connector.id,
				moduleId: module.id,
			},
			{
				connectorId: state.ui.connectionFromConnector,
				moduleId: state.ui.connectionFromModule,
			},
		]);
	};

	events.on('deleteConnection', onDeleteConnection);
	events.on('mouseup', onMouseUp);
	events.on('createConnection', onCreateConnection);
};

export default connectionMaker;
