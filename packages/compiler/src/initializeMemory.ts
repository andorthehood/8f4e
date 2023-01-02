import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generateMemoryAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = new Map<string, number>();
	compiledModules.forEach(({ wordAddress, memoryMap, moduleId }) => {
		lookup.set(moduleId + '__startAddress', wordAddress);
		memoryMap.forEach((item, id) => {
			lookup.set(moduleId + id, wordAddress + item.relativeWordAddress);
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
		const inputAddress = memoryAddresses.get(connection.toModuleId + connection.toConnectorId);
		const outputAddress = memoryAddresses.get(connection.fromModuleId + connection.fromConnectorId);
		memoryBuffer[inputAddress] = outputAddress * memoryBuffer.BYTES_PER_ELEMENT;
	});
}
