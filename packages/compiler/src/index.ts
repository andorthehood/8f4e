import { compileToAST } from '@8f4e/ast-parser';

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
import f64store from './wasmUtils/store/f64store';
import i32store from './wasmUtils/store/i32store';
import { compileModule, compileFunction, prepassNamespace } from './compiler';
import createBufferFunctionBody from './wasmBuilders/createBufferFunctionBody';
import { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
import resolveInterModularConnections from './utils/resolveInterModularConnections';
import {
	AST,
	CompileOptions,
	CompiledModule,
	CompiledModuleLookup,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	Module,
	Namespace,
	Namespaces,
} from './types';
import { EXPORTED_FUNCTION_COUNT, GLOBAL_ALIGNMENT_BOUNDARY, HEADER, VERSION } from './consts';
import sortModules from './graphOptimizer';
import WASM_MEMORY_PAGE_SIZE from './wasmUtils/consts';
import { calculateWordAlignedSizeOfMemory } from './utils/compilation';

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
export { prepassNamespace } from './compiler';
export { deriveEffectiveMemorySize } from './wasmUtils/deriveEffectiveMemorySize';
export {
	parseMacroDefinitions,
	expandMacros,
	convertExpandedLinesToCode,
	type MacroDefinition,
	type ExpandedLine,
} from './utils/macroExpansion';
export { ErrorCode, getError } from './compilerError';

export function collectNamespacesFromASTs(
	asts: AST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	builtInConsts: Namespace['consts'] = {},
	compiledFunctions?: CompiledFunctionLookup
): Namespaces {
	const namespaces: Namespaces = {};
	let nextStartingByteAddress = startingByteAddress;

	for (const ast of asts) {
		const context = prepassNamespace(ast, builtInConsts, namespaces, nextStartingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}
		namespaces[context.namespace.moduleName] = {
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
		};
		nextStartingByteAddress += calculateWordAlignedSizeOfMemory(context.namespace.memory) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}

export function compileModules(
	modules: AST[],
	options: CompileOptions,
	builtInConsts?: Namespace['consts'],
	namespaces?: Namespaces,
	compiledFunctions?: CompiledFunctionLookup
): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress ?? 0;

	// If builtInConsts not provided, use empty object - all constants come from env block
	const consts = builtInConsts ?? {};
	const ns: Namespaces =
		namespaces ??
		collectNamespacesFromASTs(modules, memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY, consts, compiledFunctions);

	return modules.map((ast, index) => {
		const module = compileModule(ast, consts, ns, memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY, index, compiledFunctions);
		memoryAddress += module.wordAlignedSize;
		return module;
	});
}

export function generateMemoryInitiatorFunctions(compiledModules: CompiledModule[]) {
	return compiledModules.map(module => {
		const instructions: number[] = [];

		Object.values(module.memoryMap).forEach(memory => {
			if (memory.numberOfElements > 1 && typeof memory.default === 'object') {
				Object.entries(memory.default).forEach(([relativeWordAddress, value]) => {
					const elementByteAddress = memory.byteAddress + parseInt(relativeWordAddress, 10) * memory.elementWordSize;
					if (memory.elementWordSize === 8) {
						instructions.push(...f64store(elementByteAddress, value));
					} else {
						instructions.push(
							...(memory.isInteger ? i32store(elementByteAddress, value) : f32store(elementByteAddress, value))
						);
					}
				});
			} else if (memory.numberOfElements === 1 && memory.default !== 0) {
				if (memory.elementWordSize === 8) {
					instructions.push(...f64store(memory.byteAddress, memory.default as number));
				} else {
					instructions.push(
						...(memory.isInteger
							? i32store(memory.byteAddress, memory.default as number)
							: f32store(memory.byteAddress, memory.default as number))
					);
				}
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
	macros?: Module[]
): {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
} {
	// Parse and expand macros if provided
	const macroDefinitions = macros ? parseMacroDefinitions(macros) : new Map();

	// Expand macros in modules
	const expandedModules = macros
		? modules.map(module => {
				const expanded = expandMacros(module, macroDefinitions);
				return convertExpandedLinesToCode(expanded);
			})
		: modules.map(module => ({ code: module.code, lineMetadata: undefined }));

	// Expand macros in functions
	const expandedFunctions =
		macros && functions
			? functions.map(func => {
					const expanded = expandMacros(func, macroDefinitions);
					return convertExpandedLinesToCode(expanded);
				})
			: (functions?.map(func => ({ code: func.code, lineMetadata: undefined })) ?? []);

	// Compile to AST with line metadata for error mapping.
	// Keep source order for layout/addresses and use dependency order only where semantic/runtime scheduling needs it.
	const astModules = expandedModules.map(({ code, lineMetadata }) => compileToAST(code, lineMetadata));
	const dependencyOrderedModules = sortModules(astModules);

	// Collect namespaces from all modules (includes both regular modules and constants blocks)
	const namespaces = collectNamespacesFromASTs(dependencyOrderedModules);

	// Compile functions first with WASM indices and type registry
	const astFunctions = expandedFunctions.map(({ code, lineMetadata }) => compileToAST(code, lineMetadata));

	// Create a shared type registry for all functions
	// Base type index is 3 (after the 3 built-in types)
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatureMap: new Map(),
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map((ast, index) =>
		compileFunction(ast, {}, namespaces, EXPORTED_FUNCTION_COUNT + index, functionTypeRegistry)
	);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = compiledFunctions.map(func => func.typeIndex!);

	// Compile all modules in source order so layout and addresses remain stable.
	const compiledModules = compileModules(
		astModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		{}, // Empty builtInConsts - all constants come from env block
		namespaces,
		compiledFunctionsMap
	);

	const compiledModulesMap = Object.fromEntries(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }]));
	const compiledModulesBySourceAst = new Map(astModules.map((ast, index) => [ast, compiledModules[index]]));
	resolveInterModularConnections(compiledModulesMap);
	const runtimeOrderedModules = dependencyOrderedModules
		.map(ast => compiledModulesBySourceAst.get(ast))
		.filter((module): module is CompiledModule => typeof module !== 'undefined');
	const cycleFunctions = compiledModules.map(({ cycleFunction }) => cycleFunction);
	const functionSignatures = compiledModules.map(() => 0x00);

	// Calculate the required memory footprint from the compiled program.
	const requiredMemoryBytes =
		compiledModules.length === 0
			? 0
			: compiledModules[compiledModules.length - 1].byteAddress +
				compiledModules[compiledModules.length - 1].wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;

	// Offset for user functions and module functions
	const userFunctionCount = compiledFunctions.length;
	// Generate cycle dispatcher calls, skipping modules with skipExecutionInCycle or initOnlyExecution flags
	const cycleFunction = runtimeOrderedModules.flatMap(module =>
		module.skipExecutionInCycle || module.initOnlyExecution
			? []
			: call(module.index + EXPORTED_FUNCTION_COUNT + userFunctionCount)
	);

	// Generate init-only module calls (run after memory initialization)
	// Skip if skipExecutionInCycle is true (precedence rule)
	const initOnlyModuleCalls = runtimeOrderedModules.flatMap(module =>
		module.initOnlyExecution && !module.skipExecutionInCycle
			? call(module.index + EXPORTED_FUNCTION_COUNT + userFunctionCount)
			: []
	);
	const initOnlyFunction = createFunction([], initOnlyModuleCalls);

	const memoryInitiatorFunction = [
		// First, call all memory initialization functions
		...compiledModules
			.map((module, index) => call(index + compiledModules.length + EXPORTED_FUNCTION_COUNT + userFunctionCount))
			.flat(),
		// Then, call init-only module cycle functions
		...initOnlyModuleCalls,
	];
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

	// Round up to whole wasm pages (64 KiB each); memory cannot be imported with fractional pages.
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));

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
				0x00,
				...userFunctionSignatureIndices,
				...functionSignatures,
				...functionSignatures,
			]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('initOnly', 0x02),
				createFunctionExport('buffer', 0x03),
			]),
			...createCodeSection([
				createFunction([], memoryInitiatorFunction),
				createFunction([], cycleFunction),
				initOnlyFunction,
				bufferFunction,
				...compiledFunctions.map(func => func.body),
				...cycleFunctions,
				...memoryInitiatorFunctions,
			]),
		]),
		compiledModules: finalCompiledModules,
		compiledFunctions: compiledFunctionsMap,
		requiredMemoryBytes,
	};
}
