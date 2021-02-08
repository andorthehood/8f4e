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

import { call, i32store } from './wasm/instructions';
import { generateOutputAddressLookup } from './initializeMemory';
import * as moduleCompilers from './modules';
import { Module } from './modules/types';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compileModules = function (modules): Module[] {
	let memoryAddress = 0;
	return modules
		.filter(({ type }) => moduleCompilers[type])
		.map(({ id, type }) => {
			const module = moduleCompilers[type](id, memoryAddress);
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

const compile = function (modules: object[], connections: object[]) {
	const compiledModules = compileModules(modules);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const functionCalls = compiledModules.map((module, index) => call(index + 2)).flat();
	const initMemory = generateMemoryInitiatorFunction(compiledModules);
	const outputAddressLookup = generateOutputAddressLookup(compiledModules);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([createFunctionType([], [])]),
			...createImportSection([createMemoryImport('js', 'memory')]),
			...createFunctionSection([0x00, 0x00, ...functionSignatures]),
			...createExportSection([createFunctionExport('init', 0x00), createFunctionExport('cycle', 0x01)]),
			...createCodeSection([
				createFunctionBody([], initMemory),
				createFunctionBody([], functionCalls),
				...functionBodies,
			]),
		]),
		outputAddressLookup,
		compiledModules,
	};
};

export default compile;
