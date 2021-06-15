import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generateOutputAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses.forEach(({ id, address }) => {
			lookup[moduleId + '_' + id] = address;
		});
	});
	return lookup;
}

function getInputName(connection: Connection): string {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
}

function getOutputName(connection: Connection): string {
	const { moduleId, connectorId } = connection.find(({ connectorId }) => !connectorId.startsWith('in'));
	return moduleId + '_' + connectorId;
}

export function setUpConnections(
	memoryBuffer: MemoryBuffer,
	memoryAddresses: MemoryAddressLookup,
	connections: Connection[]
): void {
	connections.forEach(connection => {
		const inputName = getInputName(connection);
		const outputName = getOutputName(connection);
		const inputAddress = memoryAddresses[inputName];
		const outputAddress = memoryAddresses[outputName];
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
}
