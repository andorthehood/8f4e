import connectionMaker from '../state/mutators/connections';
import { Module } from './modules/types';

const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		lookup[moduleId] = memoryAddresses;
	});
	return lookup;
};

const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

const setUpConnections = function (memoryBuffer, compiledModules, connections) {
	connections.forEach(connection => {
		const toModule = compiledModules.find(({ moduleId }) => moduleId === connection.toModule);

		if (!toModule) {
			return;
		}

		const toConnector = toModule.memoryAddresses.find(({ id }) => id === connection.toConnector);
		const inputPointerAddressInBuffer = toConnector.address / Int32Array.BYTES_PER_ELEMENT;

		const fromModule = compiledModules.find(({ moduleId }) => moduleId === connection.fromModule);
		const fromConnector = fromModule.memoryAddresses.find(({ id }) => id === connection.fromConnector);
		const outputAddress = fromConnector.address;

		memoryBuffer[inputPointerAddressInBuffer] = outputAddress;
	});
};

export const initializeMemory = function (compiledModules: Module[], connections) {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const initialMemory = compiledModules.map(({ initialMemory }) => initialMemory).flat();

	setInitialMemory(memoryBuffer, initialMemory);
	setUpConnections(memoryBuffer, compiledModules, connections);

	const outputAddressLookup = generateOutputAddressLookup(compiledModules);

	return { memoryRef, memoryBuffer, outputAddressLookup };
};
