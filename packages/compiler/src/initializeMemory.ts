import { Connection, MemoryBuffer } from './types';

export function generateOutputAddressLookup(compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses.forEach(({ id, address }) => {
			lookup[moduleId + '_' + id] = address;
		});
	});
	return lookup;
}

function getInputName(connection: Connection) {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
}

function getOutputName(connection: Connection) {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => !connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
}

export function setUpConnections(memoryBuffer: MemoryBuffer, memoryAddresses, connections: Connection[]) {
	connections.forEach(connection => {
		const inputName = getInputName(connection);
		const outputName = getOutputName(connection);
		const inputAddress = memoryAddresses[inputName];
		const outputAddress = memoryAddresses[outputName];
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
}
