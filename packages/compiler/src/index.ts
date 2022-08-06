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
	call,
	i32store,
	Type,
} from '@8f4e/bytecode-utils';
import { generateMemoryAddressLookup } from './initializeMemory';
import * as moduleCompilers from './modules';
import { Module, CompiledModule, MemoryAddressLookup } from './types';
import { createRelativeAddressCalculator } from './utils';

export * from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
export { setUpConnections } from './initializeMemory';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export function calculateModuleSize(module: CompiledModule): number {
	return module.memoryMap.reduce((accumulator, current) => {
		return accumulator + (Array.isArray(current.default) ? current.default.length : 1);
	}, 0);
}

export function getInitialMemory(module: CompiledModule): number[] {
	return module.memoryMap.reduce((accumulator, current) => {
		if (Array.isArray(current.default)) {
			accumulator.concat(current.default);
		} else {
			accumulator.push(current.default);
		}
		return accumulator;
	}, []);
}

export function compileModules(modules: Module[]): CompiledModule[] {
	let memoryAddress = 1;
	return modules
		.filter(({ engine }) => moduleCompilers[engine.name])
		.map(({ id, engine, state }) => {
			const relative = createRelativeAddressCalculator(memoryAddress, Int32Array.BYTES_PER_ELEMENT);
			const module = moduleCompilers[engine.name](id, relative, { ...engine.config, ...state });
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
