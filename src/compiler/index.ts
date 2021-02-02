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

export const initializeMemory = function () {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	setInitialMemory(memoryBuffer, [...saw(0).initialMemory, ...saw(3).initialMemory, ...saw(6).initialMemory]);

	return { memoryRef, memoryBuffer };
};

const compile = function () {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([createFunctionType([], [])]),
		...createImportSection([createMemoryImport('js', 'memory')]),
		...createFunctionSection([0x00, 0x00, 0x00, 0x00]),
		...createExportSection([createFunctionExport('cycle', 0x00)]),
		...createCodeSection([
			createFunctionBody([], [...call(1), ...call(2), ...call(3)]),
			saw(0).functionBody,
			saw(3).functionBody,
			saw(6).functionBody,
		]),
	]);
};

export default compile;
