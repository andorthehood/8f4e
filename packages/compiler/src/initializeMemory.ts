import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generateMemoryAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = {};
	compiledModules.forEach(({ wordAddress, memoryMap, moduleId }) => {
		lookup[moduleId] = { __startAddress: wordAddress };
		memoryMap.forEach(item => {
			// @ts-ignore
			if (item?.id) {
				// @ts-ignore
				lookup[moduleId][item.id] = wordAddress + item.address;
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
