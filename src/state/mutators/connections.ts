import findModuleAtViewportCoordinates from '../helpers/findModuleAtViewportCoordinates';
import findConnectorAtViewportCoordinates from '../helpers/findConnectorAtViewportCoordinates';
import findConnectorInModule from '../helpers/findConnectorInModule';
import {
	rejectConnectionByConnectorId,
	findConnectionByConnectorId,
	rejectConnectionsByModuleId,
} from '../helpers/connectionHelpers';
import { State } from '../types';

export default function connectionMaker(state: State, events) {
	const onMouseMove = event => {
		state.connectionPointB = [event.x, event.y];
		event.stopPropagation = true;
	};

	const onMouseUp = event => {
		const { x, y } = event;

		const module = findModuleAtViewportCoordinates(state.modules, state.viewport, x, y);

		if (!module) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connector = findConnectorAtViewportCoordinates(state.viewport, module, x, y);

		if (!connector) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connection = findConnectionByConnectorId(state.connections, module.id, connector.id);

		if (!state.isConnectionBeingMade && connection) {
			return events.dispatch('deleteConnection', { connectorId: connector.id, moduleId: module.id });
		}

		if (state.isConnectionBeingMade && connection) {
			if (connection) {
				return events.dispatch('error', { message: `This connector is already connected.` });
			}
		}

		if (state.isConnectionBeingMade) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);

			const connectorToConnect = findConnectorInModule(
				state.modules,
				state.connectionFromModule,
				state.connectionFromConnector
			);

			if (connector.isInput && connectorToConnect.isInput) {
				return events.dispatch('error', { message: `It doesn't make sense to connect two inputs` });
			}

			if (!connector.isInput && !connectorToConnect.isInput) {
				return events.dispatch('error', { message: `It doesn't make sense to connect two outputs` });
			}

			if (state.connectionFromModule === module.id) {
				return events.dispatch('error', { message: `Self-patching is not supported` });
			}

			events.dispatch('createConnection', { module, connector });
			return;
		}

		state.connectionPointA = [x, y];
		state.connectionPointB = [x, y];
		state.connectionFromModule = module.id;
		state.connectionFromConnector = connector.id;
		state.isConnectionBeingMade = true;
		events.on('mousemove', onMouseMove);
	};

	const onDeleteConnection = ({ moduleId, connectorId }) => {
		if (connectorId) {
			state.connections = rejectConnectionByConnectorId(state.connections, moduleId, connectorId);
		} else {
			state.connections = rejectConnectionsByModuleId(state.connections, moduleId);
		}
	};

	const onCreateConnection = ({ module, connector }) => {
		state.connections.push([
			{
				connectorId: connector.id,
				moduleId: module.id,
			},
			{
				connectorId: state.connectionFromConnector,
				moduleId: state.connectionFromModule,
			},
		]);
	};

	events.on('deleteConnection', onDeleteConnection);
	events.on('mouseup', onMouseUp);
	events.on('createConnection', onCreateConnection);
}
