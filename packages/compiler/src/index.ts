import {
	createCodeSection,
	createExportSection,
	createFunctionBody,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from './wasm/sections';

import { call, i32store } from './wasm/instructions';
import { generateOutputAddressLookup } from './initializeMemory';
import * as moduleCompilers from './modules';
import { Module } from './types';
import { Type } from 'wasm-bytecode-utils';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compileModules = function (modules): Module[] {
	let memoryAddress = 4;
	return modules
		.filter(({ engine }) => moduleCompilers[engine])
		.map(({ id, engine, config }) => {
			const module = moduleCompilers[engine](id, memoryAddress, config);
			memoryAddress += module.initialMemory.length * Int32Array.BYTES_PER_ELEMENT;
			return module;
		});
};

const generateMemoryInitiatorFunction = function (compiledModules) {
	return compiledModules
		.map(module => {
			let pointer = module.offset;
			return module.initialMemory
				.map(value => {
					const instuction = i32store(pointer, value);
					pointer += Int32Array.BYTES_PER_ELEMENT;
					return instuction;
				})
				.flat();
		})
		.flat();
};

const compile = function (modules: object[]) {
	const compiledModules = compileModules(modules);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const cycleFunction = compiledModules.map((module, index) => call(index + 2)).flat();
	const memoryInitiatorFunction = generateMemoryInitiatorFunction(compiledModules);
	const outputAddressLookup = generateOutputAddressLookup(compiledModules);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([Type.I32], [Type.I32]),
				createFunctionType([Type.I32, Type.I32], [Type.I32]),
			]),
			...createImportSection([createMemoryImport('js', 'memory', 1, 1, true)]),
			...createFunctionSection([0x00, 0x00, ...functionSignatures]),
			...createExportSection([createFunctionExport('init', 0x00), createFunctionExport('cycle', 0x01)]),
			...createCodeSection([
				createFunctionBody([], memoryInitiatorFunction),
				createFunctionBody([], cycleFunction),
				...functionBodies,
			]),
		]),
		outputAddressLookup,
		compiledModules,
	};
};

export default compile;
