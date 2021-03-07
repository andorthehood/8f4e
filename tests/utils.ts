import {
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
	createCodeSection,
	createImportSection,
	createMemoryImport,
} from '../src/compiler/wasm/sections';
import { FunctionBody } from '../src/compiler/wasm/types';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export const createSingleFunctionWASMProgram = function (functionBody: FunctionBody): Uint8Array {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([createFunctionType([], [])]),
		...createImportSection([createMemoryImport('js', 'memory')]),
		...createFunctionSection([0x00]),
		...createExportSection([createFunctionExport('test', 0x00)]),
		...createCodeSection([functionBody]),
	]);
};

export const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

export const createTestModule = async function (moduleCreator): Promise<{ memory: Int32Array; test: any, reset: () => void }> {
	const module = moduleCreator('test', 0);
	const program = createSingleFunctionWASMProgram(module.functionBody);

	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);
	
	const {
		instance: {
			exports: { test },
		},
	} = await WebAssembly.instantiate(program, {
		js: {
			memory: memoryRef,
		},
	});
	
	const reset = () => {
		setInitialMemory(memoryBuffer, module.initialMemory);
	}

	reset();

	return { memory: memoryBuffer, test, reset };
};