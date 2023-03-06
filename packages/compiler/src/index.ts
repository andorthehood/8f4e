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
} from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import { call, i32store } from './wasmUtils/instructionHelpers';
import { compile as compileModule, compileToAST } from './compiler';
import { generateMemoryAddressLookup } from './initializeMemory';
import { CompiledModule, MemoryAddressLookup, Module, CompiledModuleLookup, AST, Namespace } from './types';
import { calculateModuleWordSize } from './utils';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, I32_SIGNED_LARGEST_NUMBER } from './consts';

export * from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
export { setUpConnections } from './initializeMemory';
export * as examples from './examples';
export { Instruction } from './instructions';
export { default as instructions } from './instructions';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export function getInitialMemory(module: CompiledModule): number[] {
	return Array.from(module.memoryMap.values()).reduce((accumulator, current) => {
		if (Array.isArray(current.default)) {
			accumulator = accumulator.concat(current.default);
		} else {
			accumulator.push(current.default);
		}
		return accumulator;
	}, [] as number[]);
}

function collectGlobals(ast: AST): Namespace['consts'] {
	return Object.fromEntries(
		ast
			.filter(({ instruction }) => instruction === 'global')
			.map(({ arguments: _arguments }) => {
				return [_arguments[0].value, parseInt(_arguments[1].value.toString(), 10)];
			})
	);
}

export function compileModules(modules: Module[]): CompiledModule[] {
	let memoryAddress = 0;
	let globals: Namespace['consts'] = {
		I16_SIGNED_LARGEST_NUMBER: I16_SIGNED_LARGEST_NUMBER,
		I16_SIGNED_SMALLEST_NUMBER: I16_SIGNED_SMALLEST_NUMBER,
		I32_SIGNED_LARGEST_NUMBER: I32_SIGNED_LARGEST_NUMBER,
	};

	const astModules = modules.map(({ code }) => {
		const ast = compileToAST(code);
		globals = { ...globals, ...collectGlobals(ast) };
		return ast;
	});

	return astModules.map(ast => {
		const module = compileModule(ast, globals, memoryAddress * Int32Array.BYTES_PER_ELEMENT);
		memoryAddress += calculateModuleWordSize(module);
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
	compiledModules: CompiledModuleLookup;
} {
	const compiledModules = compileModules(modules);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const cycleFunction = compiledModules.map((module, index) => call(index + 3)).flat();
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
			...createFunctionSection([0x00, 0x00, 0x00, ...functionSignatures]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('buffer', 0x02),
			]),
			...createCodeSection([
				createFunctionBody([], memoryInitiatorFunction),
				createFunctionBody([], cycleFunction),
				createFunctionBody([], new Array(128).fill(call(1)).flat()),
				...functionBodies,
			]),
		]),
		memoryAddressLookup,
		compiledModules: new Map(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }])),
	};
}
