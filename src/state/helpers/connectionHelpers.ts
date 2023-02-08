import { Connection } from '@8f4e/compiler';

export function findConnectionByConnectorId(
	connections: Connection[],
	moduleId: string,
	connectorId: string
): Connection | undefined {
	return connections.find(({ fromModuleId, toModuleId, fromConnectorId, toConnectorId }) => {
		return (
			(fromModuleId === moduleId && fromConnectorId === connectorId) ||
			(toModuleId === moduleId && toConnectorId === connectorId)
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
