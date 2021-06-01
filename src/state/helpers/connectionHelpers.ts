import { Connection } from '../types';

export const findConnectionByConnectorId = function (
	connections: Connection[],
	moduleId: string,
	connectorId: string
): Object {
	return connections.find(parties => {
		return (
			parties.findIndex(party => {
				return party.moduleId === moduleId && party.connectorId === connectorId;
			}) !== -1
		);
	});
};

export const filterConnectionsByModuleId = function (connections: Connection[], moduleId: string): Object[] {
	return connections.filter(parties => {
		return (
			parties.findIndex(party => {
				return party.moduleId === moduleId;
			}) !== -1
		);
	});
};

export const rejectConnectionsByModuleId = function (connections: Connection[], moduleId: string): Object[] {
	return connections.filter(
		parties =>
			!parties.some(party => {
				return party.moduleId == moduleId;
			})
	);
};

export const rejectConnectionByConnectorId = function (
	connections: Connection[],
	moduleId: string,
	connectorId: string
): Object[] {
	return connections.filter(
		parties =>
			!parties.some(party => {
				return party.moduleId === moduleId && party.connectorId === connectorId;
			})
	);
};

export const findWhatIsConnectedTo = function (
	connections,
	moduleId: string,
	connectorId: string
): { moduleId: string; connectorId: string } {
	const connection = findConnectionByConnectorId(connections, moduleId, connectorId);

	return connection
		? {
				moduleId: connection[0].moduleId === moduleId ? connection[1].moduleId : connection[0].moduleId,
				connectorId: connection[0].connectorId === connectorId ? connection[1].connectorId : connection[0].connectorId,
		  }
		: null;
};
