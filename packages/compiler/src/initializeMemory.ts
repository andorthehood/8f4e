import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generatememoryAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = {};
	compiledModules.forEach(({ byteAddress, memoryMap, moduleId }) => {
		lookup[moduleId] = { __startAddress: byteAddress };
		memoryMap.forEach(item => {
			if (item.id) {
				lookup[moduleId][item.id] = byteAddress + item.address * Int32Array.BYTES_PER_ELEMENT;
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
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
}
