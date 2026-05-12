import { createFunction, createLocalDeclaration, Type } from '@8f4e/compiler-wasm-utils';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import instructions from './instructionCompilers';
import { getError } from './compilerError';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { applySemanticLine, prepassNamespace } from './semantic/buildNamespace';
import { validateInstruction } from './stackAnalysis/validateInstruction';
import { functionValueTypeToWasmType } from './utils/functionValueType';

import type {
	AST,
	CompilationContext,
	CompiledModule,
	CompiledFunction,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	InstructionCompiler,
	Namespaces,
	Instruction,
} from '@8f4e/compiler-spec';

export function compileCodegenLine(
	line: AST[number],
	context: CompilationContext,
	options: { skipValidation?: boolean } = {}
) {
	const instruction = line.instruction as Instruction;

	if (!instructions[instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	if (!options.skipValidation) {
		validateInstruction(line, context);
	}
	const compileInstruction = instructions[instruction] as InstructionCompiler;
	compileInstruction(line, context);
}

export function compileLine(line: AST[number], context: CompilationContext) {
	if (line.isMemoryDeclaration && context.mode === 'function') {
		throw getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, line, context);
	}

	validateInstruction(line, context);

	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	compileCodegenLine(line, context, { skipValidation: true });
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
	// Semantic instructions (const, use, module/moduleEnd) are applied during
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
		validateInstruction(line, context);
		if (line.isSemanticOnly) {
			applySemanticLine(line, context);
		} else if (!line.isMemoryDeclaration) {
			compileCodegenLine(line, context, { skipValidation: true });
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

	const internalResources = Object.keys(context.internalResources).length > 0 ? context.internalResources : undefined;

	return {
		id: context.namespace.moduleName,
		cycleFunction: createFunction(
			Object.values(context.locals).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, 1);
			}),
			context.byteCode
		),
		initFunctionBody: [],
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		...(internalResources ? { internalResources } : {}),
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
		...(context.currentFunctionExportName ? { exportName: context.currentFunctionExportName } : {}),
		wasmIndex,
		typeIndex,
		ast: normalizedAst,
	};
}
