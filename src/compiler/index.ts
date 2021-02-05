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
import { initializeMemory } from './initializeMemory';
import * as moduleCompilers from './modules';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compileModules = function (modules) {
	let memoryAddress = 0;
	return modules
		.filter(({ type }) => moduleCompilers[type])
		.map(({ id, type }) => {
			const module = moduleCompilers[type](id, memoryAddress);
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
	const functionSignatures = compiledModules.map(() => 0x00);
	// @ts-ignore flat
	const functionCalls = compiledModules.map((module, index) => call(index + 1)).flat();
	const outputAddressLookup = generateOutputAddressLookup(compiledModules);
	const { memoryRef, memoryBuffer } = initializeMemory(compiledModules);

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
		memoryRef,
		memoryBuffer,
	};
};

export default compile;
