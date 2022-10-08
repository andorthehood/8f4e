import {
	Type,
	call,
	createCodeSection,
	createExportSection,
	createFunctionBody,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
	i32store,
} from '@8f4e/bytecode-utils';

import { compile as compileModule } from './compiler';
import { generateMemoryAddressLookup } from './initializeMemory';
import { CompiledModule, MemoryAddressLookup, Module } from './types';

export * from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
export { setUpConnections } from './initializeMemory';
export { createTestModule } from './testUtils';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export function calculateModuleSize(module: CompiledModule): number {
	return Array.from(module.memoryMap.values()).reduce((accumulator, current) => {
		return accumulator + (Array.isArray(current.default) ? current.default.length : 1);
	}, 0);
}

export function getInitialMemory(module: CompiledModule): number[] {
	return Array.from(module.memoryMap.values()).reduce((accumulator, current) => {
		if (Array.isArray(current.default)) {
			accumulator.concat(current.default);
		} else {
			accumulator.push(current.default);
		}
		return accumulator;
	}, [] as number[]);
}

export function compileModules(modules: Module[]): CompiledModule[] {
	let memoryAddress = 1;
	return modules.map(({ id, engine }) => {
		const module = compileModule(engine.source, id, memoryAddress * Int32Array.BYTES_PER_ELEMENT);
		memoryAddress += calculateModuleSize(module);
		return module;
	});
}

export function generateMemoryInitiatorFunction(compiledModules: CompiledModule[]) {
	return compiledModules
		.map(module => {
			let pointer = module.byteAddress;
			return getInitialMemory(module)
				.map(value => {
					const instuction = i32store(pointer, value);
					pointer += Int32Array.BYTES_PER_ELEMENT;
					return instuction;
				})
				.flat();
		})
		.flat();
}

export default function compile(modules: Module[]): {
	codeBuffer: Uint8Array;
	memoryAddressLookup: MemoryAddressLookup;
	compiledModules: CompiledModule[];
} {
	const compiledModules = compileModules(modules);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const cycleFunction = compiledModules.map((module, index) => call(index + 2)).flat();
	const memoryInitiatorFunction = generateMemoryInitiatorFunction(compiledModules);
	const memoryAddressLookup = generateMemoryAddressLookup(compiledModules);

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
		memoryAddressLookup,
		compiledModules,
	};
}
