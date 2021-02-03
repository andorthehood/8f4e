import {
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
	createCodeSection,
	createFunctionBody,
	createImportSection,
	createMemoryImport,
} from './utils/sections';

import { call } from './utils/instructions';
import saw from './modules/saw';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

export const initializeMemory = function (modules: object[]) {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);
	let memoryCounter = 0;
	const initialMemory = modules
		.map(() => {
			const { initialMemory, memoryFootprint } = saw(memoryCounter);
			memoryCounter += memoryFootprint;
			return initialMemory;
		})
		.flat();

	setInitialMemory(memoryBuffer, initialMemory);

	return { memoryRef, memoryBuffer };
};

const compile = function (modules: object[], connections: object[]) {
	let memoryAddress = 0;
	const functionBodies = modules.map(() => {
		const { functionBody, memoryFootprint } = saw(memoryAddress);
		memoryAddress += memoryFootprint;
		return functionBody;
	});
	const functionSignatures = modules.map(() => 0x00);
	const functionCalls = modules.map((module, index) => call(index + 1)).flat();

	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([createFunctionType([], [])]),
		...createImportSection([createMemoryImport('js', 'memory')]),
		...createFunctionSection([0x00, ...functionSignatures]),
		...createExportSection([createFunctionExport('cycle', 0x00)]),
		...createCodeSection([createFunctionBody([], functionCalls), ...functionBodies]),
	]);
};

export default compile;
