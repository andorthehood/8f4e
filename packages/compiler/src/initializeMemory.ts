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

export function setUpConnections(
	memoryBuffer: MemoryBuffer,
	memoryAddresses: MemoryAddressLookup,
	connections: Connection[]
): void {
	connections.forEach(connection => {
		const inputName = connection.toModuleId + '_' + connection.toConnectorId;
		const outputName = connection.fromModuleId + '_' + connection.fromConnectorId;
		const inputAddress = memoryAddresses[inputName];
		const outputAddress = memoryAddresses[outputName];
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
}
