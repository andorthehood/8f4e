import {
	createCodeSection,
	createExportSection,
	createFunction,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import { call, f32store, i32store } from './wasmUtils/instructionHelpers';
import { compileModule, compileToAST } from './compiler';
// import standardLibrary from './standardLibrary/index';
import {
	AST,
	ArgumentLiteral,
	ArgumentType,
	CompileOptions,
	CompiledModule,
	CompiledModuleLookup,
	Module,
	Namespace,
	Namespaces,
} from './types';
import {
	GLOBAL_ALIGNMENT_BOUNDARY,
	I16_SIGNED_LARGEST_NUMBER,
	I16_SIGNED_SMALLEST_NUMBER,
	I32_SIGNED_LARGEST_NUMBER,
} from './consts';
import { ErrorCode, getError } from './errors';
import { sortModules } from './gaphOptimizer';
import { WASM_MEMORY_PAGE_SIZE } from './wasmUtils/consts';

export * from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
export type { Instruction } from './instructionCompilers';
export { default as instructions } from './instructionCompilers';
export { instructionParser } from './compiler';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

function collectConstants(ast: AST): Namespace['consts'] {
	return Object.fromEntries(
		ast
			.filter(({ instruction }) => instruction === 'const')
			.map(({ arguments: _arguments }) => {
				return [
					_arguments[0].value,
					{
						value: parseFloat(_arguments[1].value.toString()),
						isInteger: (_arguments[1] as ArgumentLiteral).isInteger,
					},
				];
			})
	);
}

function resolveInterModularConnections(compiledModules: CompiledModuleLookup) {
	compiledModules.forEach(({ ast, memoryMap }) => {
		ast.forEach(line => {
			const { instruction, arguments: _arguments } = line;
			if (
				['int*', 'int**', 'float*', 'float**', 'init', 'int'].includes(instruction) &&
				_arguments[0] &&
				_arguments[1] &&
				_arguments[0].type === ArgumentType.IDENTIFIER &&
				_arguments[1].type === ArgumentType.IDENTIFIER &&
				/&(\S+)\.(\S+)/.test(_arguments[1].value)
			) {
				// Remove &
				const [targetModuleId, targetMemoryId] = _arguments[1].value.substring(1).split('.');

				const targetModule = compiledModules.get(targetModuleId);

				if (!targetModule) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const targetMemory = targetModule.memoryMap.get(targetMemoryId);

				if (!targetMemory) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const memory = memoryMap.get(_arguments[0].value);

				if (memory) {
					memory.default = targetMemory.byteAddress;
				}
			}
		});
	});
}

export function compileModules(modules: AST[], options: CompileOptions): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress;
	const builtInConsts: Namespace['consts'] = {
		I16_SIGNED_LARGEST_NUMBER: { value: I16_SIGNED_LARGEST_NUMBER, isInteger: true },
		I16_SIGNED_SMALLEST_NUMBER: { value: I16_SIGNED_SMALLEST_NUMBER, isInteger: true },
		I32_SIGNED_LARGEST_NUMBER: { value: I32_SIGNED_LARGEST_NUMBER, isInteger: true },
		WORD_SIZE: { value: GLOBAL_ALIGNMENT_BOUNDARY, isInteger: true },
		...options.environmentExtensions.constants,
	};

	const namespaces: Namespaces = new Map(
		modules.map(ast => {
			const moduleName = getModuleName(ast);
			return [moduleName, { consts: collectConstants(ast) }];
		})
	);

	return modules.map((ast, index) => {
		const module = compileModule(
			ast,
			builtInConsts,
			namespaces,
			memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			options.maxMemorySize,
			index
		);
		memoryAddress += module.wordAlignedSize;

		if (options.maxMemorySize * WASM_MEMORY_PAGE_SIZE <= memoryAddress) {
			throw 'Memory limit exceeded';
		}

		return module;
	});
}

export function getModuleName(ast: AST) {
	const moduleInstruction = ast.find(line => {
		return line.instruction === 'module';
	});

	if (!moduleInstruction) {
		throw 'Missing module instruction';
	}

	const argument = moduleInstruction.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER) {
		throw 'Module instruction argument type invalid';
	}

	return argument.value;
}

export function generateMemoryInitiatorFunctions(compiledModules: CompiledModule[]) {
	return compiledModules.map(module => {
		let pointer = module.byteAddress;
		const instructions: number[] = [];

		Array.from(module.memoryMap.values()).forEach(memory => {
			if (memory.numberOfElements > 1 && memory.default instanceof Map) {
				memory.default.forEach((value, relativeWordAddress) => {
					instructions.push(
						...(memory.isInteger
							? i32store(pointer + (relativeWordAddress + 1) * GLOBAL_ALIGNMENT_BOUNDARY, value)
							: f32store(pointer + (relativeWordAddress + 1) * GLOBAL_ALIGNMENT_BOUNDARY, value))
					);
				});
				pointer += memory.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
			} else if (memory.numberOfElements === 1 && memory.default !== 0) {
				instructions.push(
					...(memory.isInteger
						? i32store(pointer, memory.default as number)
						: f32store(pointer, memory.default as number))
				);
				pointer += GLOBAL_ALIGNMENT_BOUNDARY;
			} else if (memory.numberOfElements === 1 && memory.default === 0) {
				pointer += GLOBAL_ALIGNMENT_BOUNDARY;
			}
		});

		instructions.push(...module.initFunctionBody);

		return createFunction([], instructions);
	});
}

export default function compile(
	modules: Module[],
	options: CompileOptions
): {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	allocatedMemorySize: number;
} {
	const astModules = modules.map(({ code }) => compileToAST(code, options));
	// const astFunctions = standardLibrary.map(code => compileToAST(code.split('\n'), options));
	const sortedModules = sortModules(astModules);
	const compiledModules = compileModules(sortedModules, { ...options, startingMemoryWordAddress: 1 });
	const compiledModulesMap = new Map(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }]));
	resolveInterModularConnections(compiledModulesMap);
	const loopFunctions = compiledModules.map(({ loopFunction }) => loopFunction);
	// const initFunctionBodies = compiledModules.map(({ initFunctionBody }) => initFunctionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const cycleFunction = compiledModules.map((module, index) => call(index + 3)).flat();
	const memoryInitiatorFunction = compiledModules
		.map((module, index) => call(index + compiledModules.length + 3))
		.flat();
	const memoryInitiatorFunctions = generateMemoryInitiatorFunctions(compiledModules);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([Type.I32], [Type.I32]),
				createFunctionType([Type.I32, Type.I32], [Type.I32]),
			]),
			...createImportSection([
				createMemoryImport('js', 'memory', options.initialMemorySize, options.maxMemorySize, true),
			]),
			...createFunctionSection([0x00, 0x00, 0x00, ...functionSignatures, ...functionSignatures]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('buffer', 0x02),
			]),
			...createCodeSection([
				createFunction([], memoryInitiatorFunction),
				createFunction([], cycleFunction),
				createFunction([], new Array(128).fill(call(1)).flat()),
				...loopFunctions,
				...memoryInitiatorFunctions,
			]),
		]),
		compiledModules: compiledModulesMap,
		allocatedMemorySize:
			compiledModules[compiledModules.length - 1].byteAddress +
			compiledModules[compiledModules.length - 1].wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY,
	};
}
