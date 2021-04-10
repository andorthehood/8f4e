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
} from 'bytecode-utils';
import { generateOutputAddressLookup } from './initializeMemory';
import * as moduleCompilers from './modules';
import { Module, CompiledModule } from './types';
import { createRelativeAddressCalculator } from './utils';

export { Module, Connection, Connector } from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
export { setUpConnections } from './initializeMemory';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compileModules = function (modules: Module[]): CompiledModule[] {
	let memoryAddress = 1;
	return modules
		.filter(({ engine }) => moduleCompilers[engine])
		.map(({ id, engine, config }) => {
			const relative = createRelativeAddressCalculator(memoryAddress, Int32Array.BYTES_PER_ELEMENT);
			const module = moduleCompilers[engine](id, relative, config);
			memoryAddress += module.initialMemory.length;
			return module;
		});
};

const generateMemoryInitiatorFunction = function (compiledModules: CompiledModule[]) {
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

const compile = function (modules: Module[]) {
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
