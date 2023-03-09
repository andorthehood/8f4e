import { Connection, Module } from '@8f4e/compiler';

import { Connector, GraphicHelper, State } from '../types';

export function findConnectionByConnectorId(
	state: State,
	module: Module,
	connector: Connector
): GraphicHelper['connections'][number] | undefined {
	return state.graphicHelper.connections.find(({ fromModule, toModule, fromConnectorId, toConnectorId }) => {
		return (
			(fromModule === module && fromConnectorId === connector.id) ||
			(toModule === module && toConnectorId === connector.id)
		);
	});
}

export function filterConnectionsByModuleId(connections: Connection[], moduleId: string): Connection[] {
	return connections.filter(({ fromModuleId, toModuleId }) => {
		return fromModuleId === moduleId || toModuleId === moduleId;
	});
}

export function rejectConnectionsByModuleId(connections: Connection[], moduleId: string): Connection[] {
	return connections.filter(({ fromModuleId, toModuleId }) => {
		return !(fromModuleId === moduleId || toModuleId === moduleId);
	});
}

export function rejectConnectionByConnectorId(
	connections: Connection[],
	moduleId: string,
	connectorId: string
): Connection[] {
	return connections.filter(({ fromModuleId, toModuleId, fromConnectorId, toConnectorId }) => {
		return !(
			(fromModuleId === moduleId && fromConnectorId === connectorId) ||
			(toModuleId === moduleId && toConnectorId === connectorId)
		);
	});
}

export function findWhatIsConnectedTo(
	connections: Connection[],
	moduleId: string,
	connectorId: string
): { moduleId: string; connectorId: string } | undefined {
	const connection = findConnectionByConnectorId(connections, moduleId, connectorId);
	return connection ? { moduleId: connection.toModuleId, connectorId: connection.toConnectorId } : undefined;
}
