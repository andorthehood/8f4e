import { Connection, MemoryBuffer } from './types';

export const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses.forEach(({ id, address }) => {
			lookup[moduleId + '_' + id] = address;
		});
	});
	return lookup;
};

const getInputName = function (connection: Connection) {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
};

const getOutputName = function (connection: Connection) {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => !connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
};

export const setUpConnections = function (memoryBuffer: MemoryBuffer, memoryAddresses, connections: Connection[]) {
	connections.forEach(connection => {
		const inputName = getInputName(connection);
		const outputName = getOutputName(connection);
		const inputAddress = memoryAddresses[inputName];
		const outputAddress = memoryAddresses[outputName];
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
};
