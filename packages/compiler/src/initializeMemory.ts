import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generateMemoryAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = {};
	compiledModules.forEach(({ wordAddress, memoryMap, moduleId }) => {
		lookup[moduleId] = { __startAddress: wordAddress };
		Array.from(memoryMap.entries()).forEach(([id, item]) => {
			// @ts-ignore
			if (id) {
				// @ts-ignore
				lookup[moduleId][id] = wordAddress + item.address;
			}
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
		const inputAddress = memoryAddresses[connection.toModuleId][connection.toConnectorId];
		const outputAddress = memoryAddresses[connection.fromModuleId][connection.fromConnectorId];
		memoryBuffer[inputAddress] = outputAddress * memoryBuffer.BYTES_PER_ELEMENT;
	});
}
