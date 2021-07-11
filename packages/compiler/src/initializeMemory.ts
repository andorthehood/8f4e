import { CompiledModule, Connection, MemoryAddressLookup, MemoryBuffer } from './types';

export function generatememoryAddressLookup(compiledModules: CompiledModule[]): MemoryAddressLookup {
	const lookup = {};
	compiledModules.forEach(({ offset, memoryMap, moduleId }) => {
		lookup[moduleId] = offset;
		memoryMap.forEach(item => {
			if (item.id) {
				lookup[moduleId + '_' + item.id] = offset + item.address * Int32Array.BYTES_PER_ELEMENT;
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
		const inputName = connection.toModuleId + '_' + connection.toConnectorId;
		const outputName = connection.fromModuleId + '_' + connection.fromConnectorId;
		const inputAddress = memoryAddresses[inputName];
		const outputAddress = memoryAddresses[outputName];
		memoryBuffer[inputAddress / memoryBuffer.BYTES_PER_ELEMENT] = outputAddress;
	});
}
