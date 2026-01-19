import createCodeSection from './wasmUtils/codeSection/createCodeSection';
import createFunction from './wasmUtils/codeSection/createFunction';
import createExportSection from './wasmUtils/export/createExportSection';
import createFunctionExport from './wasmUtils/export/createFunctionExport';
import createImportSection from './wasmUtils/import/createImportSection';
import createMemoryImport from './wasmUtils/import/createMemoryImport';
import createFunctionSection from './wasmUtils/typeFunction/createFunctionSection';
import createFunctionType from './wasmUtils/typeFunction/createFunctionType';
import createTypeSection from './wasmUtils/typeFunction/createTypeSection';
import Type from './wasmUtils/type';
import call from './wasmUtils/call/call';
import f32store from './wasmUtils/store/f32store';
import i32store from './wasmUtils/store/i32store';
import { compileModule, compileToAST, compileFunction } from './compiler';
import collectConstants from './astUtils/collectConstants';
import getConstantsName from './astUtils/getConstantsName';
import getModuleName from './astUtils/getModuleName';
import createBufferFunctionBody from './wasmBuilders/createBufferFunctionBody';
import {
	AST,
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
	EXPORTED_FUNCTION_COUNT,
	GLOBAL_ALIGNMENT_BOUNDARY,
	HEADER,
	I16_SIGNED_LARGEST_NUMBER,
	I16_SIGNED_SMALLEST_NUMBER,
	I32_SIGNED_LARGEST_NUMBER,
	VERSION,
} from './consts';
import { ErrorCode, getError } from './errors';
import sortModules from './graphOptimizer';
import WASM_MEMORY_PAGE_SIZE from './wasmUtils/consts';

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
export { default as collectConstants } from './astUtils/collectConstants';
export { default as getConstantsName } from './astUtils/getConstantsName';
export { default as getModuleName } from './astUtils/getModuleName';
export { instructionParser } from './compiler';

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
	builtInConsts?: Namespace['consts'],
	namespaces?: Namespaces,
	compiledFunctions?: CompiledFunctionLookup
): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress;

	// If builtInConsts not provided, use defaults
	const consts = builtInConsts ?? {
		I16_SIGNED_LARGEST_NUMBER: { value: I16_SIGNED_LARGEST_NUMBER, isInteger: true },
		I16_SIGNED_SMALLEST_NUMBER: { value: I16_SIGNED_SMALLEST_NUMBER, isInteger: true },
		I32_SIGNED_LARGEST_NUMBER: { value: I32_SIGNED_LARGEST_NUMBER, isInteger: true },
		WORD_SIZE: { value: GLOBAL_ALIGNMENT_BOUNDARY, isInteger: true },
	};

	// If namespaces not provided, collect from modules
	const ns =
		namespaces ??
		Object.fromEntries(
			modules.map(ast => {
				const isConstantsBlock = ast.some(line => line.instruction === 'constants');
				const name = isConstantsBlock ? getConstantsName(ast) : getModuleName(ast);
				return [name, { consts: collectConstants(ast) }];
			})
		);

	return modules.map((ast, index) => {
		const module = compileModule(
			ast,
			consts,
			ns,
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
	functions?: Module[]
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
	};

	// Collect namespaces from all modules (includes both regular modules and constants blocks)
	const namespaces: Namespaces = Object.fromEntries(
		sortedModules.map(ast => {
			// Determine if this is a constants block or regular module
			const isConstantsBlock = ast.some(line => line.instruction === 'constants');
			const name = isConstantsBlock ? getConstantsName(ast) : getModuleName(ast);
			return [name, { consts: collectConstants(ast) }];
		})
	);

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

	// Compile all modules (constants blocks are already sorted first by sortModules)
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

	// Apply defaults for buffer options
	const bufferSize = options.bufferSize ?? 128;
	const bufferStrategy = options.bufferStrategy ?? 'loop';

	// Create buffer function (includes locals and body)
	const bufferFunction = createBufferFunctionBody(bufferSize, bufferStrategy, 1);

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
				bufferFunction,
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
