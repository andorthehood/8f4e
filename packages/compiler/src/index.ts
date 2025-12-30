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
import { compileModule, compileToAST, compileFunction } from './compiler';
import {
	AST,
	ArgumentLiteral,
	ArgumentType,
	CompileOptions,
	CompiledModule,
	CompiledModuleLookup,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
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

export {
	MemoryTypes,
	type DataStructure,
	type MemoryMap,
	type CompiledModule,
	type CompiledModuleLookup,
	type CompiledFunction,
	type CompiledFunctionLookup,
	type FunctionSignature,
	type MemoryBuffer,
	type Connection,
	type Module,
	ArgumentType,
	type ArgumentLiteral,
	type ArgumentIdentifier,
	type Argument,
	type AST,
	type TestModule,
	type Const,
	type Consts,
	type Namespace,
	type Namespaces,
	type CompilationContext,
	type CompilationMode,
	type StackItem,
	type Stack,
	BLOCK_TYPE,
	type BlockStack,
	type InstructionCompiler,
	type Error,
	type CompileOptions,
} from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
export type { Instruction } from './instructionCompilers';
export { default as instructions } from './instructionCompilers';
export { instructionParser } from './compiler';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

// Number of exported WASM functions (init, cycle, buffer)
const EXPORTED_FUNCTION_COUNT = 3;

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
	Object.values(compiledModules).forEach(({ ast, memoryMap }) => {
		ast!.forEach(line => {
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

				const targetModule = compiledModules[targetModuleId];

				if (!targetModule) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const targetMemory = targetModule.memoryMap[targetMemoryId];

				if (!targetMemory) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const memory = memoryMap[_arguments[0].value];

				if (memory) {
					memory.default = targetMemory.byteAddress;
				}
			}
		});
	});
}

export function compileModules(
	modules: AST[],
	options: CompileOptions,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	compiledFunctions?: CompiledFunctionLookup
): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress;

	return modules.map((ast, index) => {
		const module = compileModule(
			ast,
			builtInConsts,
			namespaces,
			memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			options.memorySizeBytes,
			index,
			compiledFunctions
		);
		memoryAddress += module.wordAlignedSize;

		if (options.memorySizeBytes <= memoryAddress) {
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

export function getConstantsName(ast: AST) {
	const constantsInstruction = ast.find(line => {
		return line.instruction === 'constants';
	});

	if (!constantsInstruction) {
		throw 'Missing constants instruction';
	}

	const argument = constantsInstruction.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER) {
		throw 'Constants instruction argument type invalid';
	}

	return argument.value;
}

export function generateMemoryInitiatorFunctions(compiledModules: CompiledModule[]) {
	return compiledModules.map(module => {
		let pointer = module.byteAddress;
		const instructions: number[] = [];

		Object.values(module.memoryMap).forEach(memory => {
			if (memory.numberOfElements > 1 && typeof memory.default === 'object') {
				Object.entries(memory.default).forEach(([relativeWordAddress, value]) => {
					instructions.push(
						...(memory.isInteger
							? i32store(pointer + (parseInt(relativeWordAddress, 10) + 1) * GLOBAL_ALIGNMENT_BOUNDARY, value)
							: f32store(pointer + (parseInt(relativeWordAddress, 10) + 1) * GLOBAL_ALIGNMENT_BOUNDARY, value))
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

function stripASTFromCompiledModules(compiledModules: CompiledModuleLookup): CompiledModuleLookup {
	const strippedModules: CompiledModuleLookup = {};
	for (const [id, module] of Object.entries(compiledModules)) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { ast, ...moduleWithoutAST } = module;
		strippedModules[id] = moduleWithoutAST as CompiledModule;
	}
	return strippedModules;
}

export default function compile(
	modules: Module[],
	options: CompileOptions,
	functions?: Module[],
	constants?: Module[]
): {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	allocatedMemorySize: number;
} {
	const astModules = modules.map(({ code }) => compileToAST(code, options));
	const sortedModules = sortModules(astModules);

	const builtInConsts: Namespace['consts'] = {
		I16_SIGNED_LARGEST_NUMBER: { value: I16_SIGNED_LARGEST_NUMBER, isInteger: true },
		I16_SIGNED_SMALLEST_NUMBER: { value: I16_SIGNED_SMALLEST_NUMBER, isInteger: true },
		I32_SIGNED_LARGEST_NUMBER: { value: I32_SIGNED_LARGEST_NUMBER, isInteger: true },
		WORD_SIZE: { value: GLOBAL_ALIGNMENT_BOUNDARY, isInteger: true },
		...options.environmentExtensions.constants,
	};

	// Collect constants from constants blocks
	const astConstants = constants ? constants.map(({ code }) => compileToAST(code, options)) : [];
	const constantsNamespaces: Namespaces = Object.fromEntries(
		astConstants.map(ast => {
			const constantsName = getConstantsName(ast);
			return [constantsName, { consts: collectConstants(ast) }];
		})
	);

	// Collect constants from modules
	const moduleNamespaces: Namespaces = Object.fromEntries(
		sortedModules.map(ast => {
			const moduleName = getModuleName(ast);
			return [moduleName, { consts: collectConstants(ast) }];
		})
	);

	// Check for name conflicts between constants blocks and modules
	for (const constantsName of Object.keys(constantsNamespaces)) {
		if (moduleNamespaces[constantsName]) {
			throw new Error(`Name conflict: '${constantsName}' is used as both a constants block and a module name`);
		}
	}

	// Merge namespaces (constants blocks and modules)
	const namespaces: Namespaces = { ...constantsNamespaces, ...moduleNamespaces };

	// Compile functions first with WASM indices and type registry
	const astFunctions = functions ? functions.map(({ code }) => compileToAST(code, options)) : [];

	// Create a shared type registry for all functions
	// Base type index is 3 (after the 3 built-in types)
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatureMap: new Map(),
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map((ast, index) =>
		compileFunction(ast, builtInConsts, namespaces, EXPORTED_FUNCTION_COUNT + index, functionTypeRegistry)
	);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = compiledFunctions.map(func => func.typeIndex!);

	// Compile modules with function context available
	const compiledModules = compileModules(
		sortedModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		builtInConsts,
		namespaces,
		compiledFunctionsMap
	);

	const compiledModulesMap = Object.fromEntries(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }]));
	resolveInterModularConnections(compiledModulesMap);
	const loopFunctions = compiledModules.map(({ loopFunction }) => loopFunction);
	const functionSignatures = compiledModules.map(() => 0x00);

	// Offset for user functions and module functions
	const userFunctionCount = compiledFunctions.length;
	const cycleFunction = compiledModules
		.map((module, index) => call(index + EXPORTED_FUNCTION_COUNT + userFunctionCount))
		.flat();
	const memoryInitiatorFunction = compiledModules
		.map((module, index) => call(index + compiledModules.length + EXPORTED_FUNCTION_COUNT + userFunctionCount))
		.flat();
	const memoryInitiatorFunctions = generateMemoryInitiatorFunctions(compiledModules);

	// Strip AST from final result if not requested
	const finalCompiledModules = options.includeAST
		? compiledModulesMap
		: stripASTFromCompiledModules(compiledModulesMap);

	const memorySizePages = Math.ceil(options.memorySizeBytes / WASM_MEMORY_PAGE_SIZE);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([Type.I32], [Type.I32]),
				createFunctionType([Type.I32, Type.I32], [Type.I32]),
				...uniqueUserFunctionTypes,
			]),
			...createImportSection([
				createMemoryImport('js', 'memory', memorySizePages, memorySizePages, !options.disableSharedMemory),
			]),
			...createFunctionSection([
				0x00,
				0x00,
				0x00,
				...userFunctionSignatureIndices,
				...functionSignatures,
				...functionSignatures,
			]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('buffer', 0x02),
			]),
			...createCodeSection([
				createFunction([], memoryInitiatorFunction),
				createFunction([], cycleFunction),
				createFunction([], new Array(128).fill(call(1)).flat()),
				...compiledFunctions.map(func => func.body),
				...loopFunctions,
				...memoryInitiatorFunctions,
			]),
		]),
		compiledModules: finalCompiledModules,
		compiledFunctions: compiledFunctionsMap,
		allocatedMemorySize:
			compiledModules[compiledModules.length - 1].byteAddress +
			compiledModules[compiledModules.length - 1].wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY,
	};
}
