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
} from './wasm/sections';

import { call } from './wasm/instructions';
import saw from './modules/saw';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

export const initializeMemory = function (modules) {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);
	let memoryCounter = 0;

	const initialMemory = modules
		.map(({ id }) => {
			const { initialMemory } = saw(id, memoryCounter);
			memoryCounter += initialMemory.length;
			return initialMemory;
		})
		// @ts-ignore flat
		.flat();

	setInitialMemory(memoryBuffer, initialMemory);

	return { memoryRef, memoryBuffer };
};

const compileModules = function (modules) {
	let memoryAddress = 0;
	return modules.map(({ id }) => {
		const module = saw(id, memoryAddress);
		memoryAddress += module.initialMemory.length;
		return module;
	});
};

const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ outputs, moduleId }) => {
		lookup[moduleId] = outputs.map(output => ({ outputId: output.id, memoryAddress: output.address }));
	});
	return lookup;
};

const compile = function (modules: object[], connections: object[]) {
	const compiledModules = compileModules(modules);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = modules.map(() => 0x00);
	// @ts-ignore flat
	const functionCalls = modules.map((module, index) => call(index + 1)).flat();
	const outputAddressLookup = generateOutputAddressLookup(compiledModules);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([createFunctionType([], [])]),
			...createImportSection([createMemoryImport('js', 'memory')]),
			...createFunctionSection([0x00, ...functionSignatures]),
			...createExportSection([createFunctionExport('cycle', 0x00)]),
			...createCodeSection([createFunctionBody([], functionCalls), ...functionBodies]),
		]),
		outputAddressLookup,
	};
};

export default compile;
