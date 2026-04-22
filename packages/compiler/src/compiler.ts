import { compileToAST } from '@8f4e/tokenizer';
import { createFunction, createLocalDeclaration, f32store, f64store, i32store, Type } from '@8f4e/compiler-wasm-utils';

import instructions, { Instruction } from './instructionCompilers';
import {
	AST,
	CompilationContext,
	CompiledModule,
	CompiledFunction,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	Namespaces,
} from './types';
import { ErrorCode, getError } from './compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { applySemanticLine, prepassNamespace } from './semantic/buildNamespace';
import { functionValueTypeToWasmType } from './utils/functionValueType';

export type { MemoryTypes, MemoryMap } from './types';

export function compileCodegenLine(line: AST[number], context: CompilationContext) {
	const instruction = line.instruction as Instruction;

	if (!instructions[instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	instructions[instruction](line, context);
}

export function compileLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	if (line.isMemoryDeclaration && context.mode === 'function') {
		throw getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, line, context);
	}

	compileCodegenLine(line, context);
}

export function compileSegment(
	code: string[],
	context: CompilationContext,
	lineMetadata?: Array<{ callSiteLineNumber: number; macroId?: string }>
) {
	const rawAst = compileToAST(code, lineMetadata);
	rawAst.forEach(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
	});
	return context;
}

export function compileModule(
	ast: AST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	index: number,
	functions?: CompiledFunctionLookup,
	internalAllocator = { nextByteAddress: 0 }
): CompiledModule {
	// Prepass establishes the memory layout (byte addresses, sizes) for this module.
	// Semantic instructions (const, use, init, module/moduleEnd) are applied during
	// the compilation loop below, so consts are not copied from the prepass context.
	const prepassContext = prepassNamespace(ast, namespaces, startingByteAddress, functions);
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: prepassContext.namespace.memory,
			consts: {},
			moduleName: undefined,
			functions,
		},
		locals: {},
		internalResources: {},
		internalAllocator,
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: prepassContext.currentModuleNextWordOffset,
		currentModuleWordAlignedSize: prepassContext.currentModuleWordAlignedSize,
		mode: 'module',
	};

	const normalizedAst = ast.map(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		if (line.isSemanticOnly) {
			applySemanticLine(line, context);
		} else if (!line.isMemoryDeclaration) {
			compileCodegenLine(line, context);
		}
		return line;
	});

	if (!context.namespace.moduleName) {
		throw getError(
			ErrorCode.MISSING_MODULE_ID,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	if (context.stack.length > 0) {
		throw getError(
			ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	const internalResourceInitBody = Object.values(context.internalResources).flatMap(resource => {
		if (resource.default === 0) {
			return [];
		}

		if (resource.storageType === 'float64') {
			return f64store(resource.byteAddress, resource.default);
		}

		return resource.storageType === 'int'
			? i32store(resource.byteAddress, resource.default)
			: f32store(resource.byteAddress, resource.default);
	});

	return {
		id: context.namespace.moduleName,
		cycleFunction: createFunction(
			Object.values(context.locals).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, 1);
			}),
			context.byteCode
		),
		initFunctionBody: internalResourceInitBody,
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		wordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
		ast: normalizedAst,
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
		initOnlyExecution: context.initOnlyExecution,
	};
}

export function compileFunction(
	ast: AST,
	namespaces: Namespaces,
	wasmIndex: number,
	typeRegistry: FunctionTypeRegistry,
	functions?: CompiledFunctionLookup
): CompiledFunction {
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: {},
			consts: {},
			moduleName: undefined,
			functions: functions ?? {},
		},
		locals: {},
		internalResources: {},
		internalAllocator: {
			nextByteAddress: 0,
		},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		mode: 'function',
		codeBlockType: 'function',
		functionTypeRegistry: typeRegistry,
	};

	const normalizedAst = ast.map(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
		return line;
	});

	if (!context.currentFunctionId) {
		throw getError(
			ErrorCode.MISSING_FUNCTION_ID,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'function', arguments: [] },
			context
		);
	}

	if (!context.currentFunctionSignature) {
		throw getError(
			ErrorCode.INVALID_FUNCTION_SIGNATURE,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'function', arguments: [] },
			context
		);
	}

	// Collect locals (excluding parameters)
	// Parameters are always at indices 0, 1, 2, ..., (parameterCount - 1)
	// Regular locals declared with the 'local' instruction come after parameters
	const parameterCount = context.currentFunctionSignature.parameters.length;
	const localDeclarations = Object.entries(context.locals)
		.filter(([, local]) => local.index >= parameterCount)
		.map(([, local]) => ({
			isInteger: local.isInteger,
			isFloat64: local.isFloat64,
			count: 1,
		}));

	// Get the type index for this function's signature
	const params = context.currentFunctionSignature.parameters.map(functionValueTypeToWasmType);
	const results = context.currentFunctionSignature.returns.map(functionValueTypeToWasmType);
	const signature = JSON.stringify({ params, results });
	const typeIndex = typeRegistry.signatureMap.get(signature);

	return {
		id: context.currentFunctionId,
		signature: context.currentFunctionSignature,
		body: createFunction(
			localDeclarations.map(local =>
				createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, local.count)
			),
			context.byteCode
		),
		locals: localDeclarations,
		wasmIndex,
		typeIndex,
		ast: normalizedAst,
	};
}
