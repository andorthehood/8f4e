import findModuleAtViewportCoordinates from '../helpers/findModuleAtViewportCoordinates';
import findConnectorAtViewportCoordinates from '../helpers/findConnectorAtViewportCoordinates';
import findConnectorInModule from '../helpers/findConnectorInModule';
import {
	findConnectionByConnectorId,
	rejectConnectionByConnectorId,
	rejectConnectionsByModuleId,
} from '../helpers/connectionHelpers';
import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function connectionMaker(state: State, events: EventDispatcher): void {
	function onMouseMove(event) {
		state.connectionPointB = [event.x, event.y];
		event.stopPropagation = true;
	}

	function onMouseUp(event) {
		const { x, y } = event;

		const module = findModuleAtViewportCoordinates(state.graphicHelper, state.project.viewport, x, y);

		if (!module) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connector = findConnectorAtViewportCoordinates(state.project.viewport, state.graphicHelper, module, x, y);

		if (!connector) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);
			return;
		}

		const connection = findConnectionByConnectorId(state, module, connector);

		if (!state.isConnectionBeingMade && connection) {
			return events.dispatch('deleteConnection', {
				connectorId: connector.id,
				module: module,
			});
		}

		if (state.isConnectionBeingMade && connection) {
			if (connection) {
				return events.dispatch('error', {
					message: `This connector is already connected.`,
				});
			}
		}

		if (state.isConnectionBeingMade) {
			state.isConnectionBeingMade = false;
			events.off('mousemove', onMouseMove);

			const connectorToConnect = findConnectorInModule(
				state.graphicHelper,
				state.connectionFromModule,
				state.connectionFromConnector
			);

			if (connector.isInput && connectorToConnect.isInput) {
				return events.dispatch('error', {
					message: `It doesn't make sense to connect two inputs`,
				});
			}

			if (!connector.isInput && !connectorToConnect.isInput) {
				return events.dispatch('error', {
					message: `It doesn't make sense to connect two outputs`,
				});
			}

			if (state.connectionFromModule === module) {
				return events.dispatch('error', {
					message: `Self-patching is not supported`,
				});
			}

			events.dispatch('createConnection', { module, connector });
			return;
		}

		state.connectionPointA = [x, y];
		state.connectionPointB = [x, y];
		state.connectionFromModule = module;
		state.connectionFromConnector = connector.id;
		state.isConnectionBeingMade = true;

		events.on('mousemove', onMouseMove);
	}

	function onDeleteConnection({ module, connectorId }) {
		const moduleId = state.graphicHelper.modules.get(module)?.id;

		if (!moduleId) {
			return;
		}

		if (connectorId) {
			state.project.connections = rejectConnectionByConnectorId(state.project.connections, moduleId, connectorId);
		} else {
			state.project.connections = rejectConnectionsByModuleId(state.project.connections, moduleId);
		}
	}

	function onCreateConnection({ module, connector }) {
		if (!state.connectionFromModule || !state.connectionFromConnector) {
			return;
		}

		const fromModuleGraphicData = state.graphicHelper.modules.get(state.connectionFromModule);
		const tomModuleGraphicData = state.graphicHelper.modules.get(module);

		if (!fromModuleGraphicData || !tomModuleGraphicData) {
			return;
		}

		state.project.connections.push({
			toConnectorId: connector.id,
			toModuleId: tomModuleGraphicData.id,
			fromConnectorId: state.connectionFromConnector,
			fromModuleId: fromModuleGraphicData.id,
		});
	}

	events.on('deleteConnection', onDeleteConnection);
	events.on('mouseup', onMouseUp);
	events.on('createConnection', onCreateConnection);
}
