import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import instructions from './instructionCompilers';
import { getError } from './compilerError';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { applySemanticLine, prepassNamespace } from './semantic/buildNamespace';
import { analyzeInstruction } from './stackAnalysis/analyzeInstruction';
import { getMemoryRegionFields } from './semantic/memoryRegions';
import { createCompilationContext } from './semantic/createCompilationContext';

import type {
	CompilerASTLine,
	AnalyzedLine,
	CompilationContext,
	ConstantsAST,
	CompiledModule,
	CompiledFunction,
	CompiledStackAnalysisLine,
	CompileOptions,
	FunctionMetadataLookup,
	FunctionCompilationContext,
	FunctionAST,
	ModuleAST,
	FunctionTypeRegistry,
	InstructionCompiler,
	ModuleCompilationContext,
	Namespaces,
} from '@8f4e/compiler-spec';
import type { Instruction } from './instructionCompilers';

type CompletedFunctionCompilationContext = FunctionCompilationContext & {
	currentFunctionId: string;
	currentFunctionTypeIndex: number;
};

function getFallbackErrorLine(ast: { lines: readonly CompilerASTLine[] }): CompilerASTLine {
	return (
		ast.lines[0] ?? {
			lineNumberBeforeMacroExpansion: 0,
			lineNumberAfterMacroExpansion: 0,
			instruction: 'block',
			arguments: [],
		}
	);
}

export function compileCodegenLine(line: AnalyzedLine, context: CompilationContext) {
	const instruction = line.instruction as Instruction;

	if (!instructions[instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	const compileInstruction = instructions[instruction] as InstructionCompiler;
	compileInstruction(line, context);
}

function toCompiledStackAnalysisLine(line: AnalyzedLine): CompiledStackAnalysisLine {
	return {
		lineNumberBeforeMacroExpansion: line.lineNumberBeforeMacroExpansion,
		lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
		instruction: line.instruction,
		stackAnalysis: line.stackAnalysis,
	};
}

export function compileLine(line: CompilerASTLine, context: CompilationContext): AnalyzedLine | undefined {
	if (line.isMemoryDeclaration && context.mode === 'function') {
		throw getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, line, context);
	}

	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	const analyzedLine = analyzeInstruction(line, context);
	compileCodegenLine(analyzedLine, context);
	return analyzedLine;
}

export function compileModule(
	ast: ModuleAST | ConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	index: number,
	functions?: FunctionMetadataLookup,
	internalAllocator = { nextByteAddress: 0 },
	options: Pick<CompileOptions, 'includeStackAnalysis' | 'memoryRegions'> = {}
): CompiledModule {
	// Prepass establishes the memory layout (byte addresses, sizes) for this module.
	// Semantic instructions (const, use, module/moduleEnd) are applied during
	// the compilation loop below, so consts are not copied from the prepass context.
	const prepassContext = prepassNamespace(ast, namespaces, startingByteAddress, functions, options);
	const namespace = namespaces[ast.id];
	const memoryIndex = namespace?.memoryIndex ?? prepassContext.currentMemoryIndex;
	const memoryRegionName = namespace?.memoryRegionName ?? prepassContext.currentMemoryRegionName;
	const context = createCompilationContext<ModuleCompilationContext>({
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
		currentMemoryIndex: memoryIndex,
		...(memoryRegionName ? { currentMemoryRegionName: memoryRegionName } : {}),
		memoryRegions: options.memoryRegions ?? [],
		mode: 'module',
	});

	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	for (const originalLine of ast.lines) {
		const line = normalizeCompileTimeArguments(originalLine, context);
		if (line.isSemanticOnly) {
			applySemanticLine(line, context);
		} else if (!line.isMemoryDeclaration) {
			const analyzedLine = analyzeInstruction(line, context);
			compileCodegenLine(analyzedLine, context);
			if (options.includeStackAnalysis) {
				stackAnalysis.push(toCompiledStackAnalysisLine(analyzedLine));
			}
		}
	}

	if (context.stack.length > 0) {
		throw getError(ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS, getFallbackErrorLine(ast), context);
	}

	const internalResources = Object.keys(context.internalResources).length > 0 ? context.internalResources : undefined;

	return {
		id: ast.id,
		cycleFunction: createFunction(
			Object.values(context.locals).map(local => {
				return createLocalDeclaration(
					local.isInteger ? WASM_TYPE_I32 : local.isFloat64 ? WASM_TYPE_F64 : WASM_TYPE_F32,
					1
				);
			}),
			context.byteCode
		),
		initFunctionBody: [],
		...getMemoryRegionFields(memoryIndex, memoryRegionName),
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		...(internalResources ? { internalResources } : {}),
		wordAlignedSize: context.currentModuleWordAlignedSize,
		ast,
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
		initOnlyExecution: context.initOnlyExecution,
	};
}

export function compileFunction(
	ast: FunctionAST,
	namespaces: Namespaces,
	wasmIndex: number,
	typeRegistry: FunctionTypeRegistry,
	functions?: FunctionMetadataLookup,
	options: Pick<CompileOptions, 'includeStackAnalysis'> = {}
): CompiledFunction {
	const context = createCompilationContext<FunctionCompilationContext>({
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
		currentMemoryIndex: 0,
		memoryRegions: [],
		mode: 'function',
		codeBlockType: 'function',
		currentFunctionSignature: {
			parameters: [],
			returns: [],
		},
		functionTypeRegistry: typeRegistry,
	});

	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	for (const originalLine of ast.lines) {
		const line = normalizeCompileTimeArguments(originalLine, context);
		const analyzedLine = compileLine(line, context);
		if (options.includeStackAnalysis && analyzedLine) {
			stackAnalysis.push(toCompiledStackAnalysisLine(analyzedLine));
		}
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

	const completedContext = context as CompletedFunctionCompilationContext;

	return {
		id: ast.id,
		signature: completedContext.currentFunctionSignature,
		body: createFunction(
			localDeclarations.map(local =>
				createLocalDeclaration(
					local.isInteger ? WASM_TYPE_I32 : local.isFloat64 ? WASM_TYPE_F64 : WASM_TYPE_F32,
					local.count
				)
			),
			context.byteCode
		),
		locals: localDeclarations,
		...(completedContext.currentFunctionExportName ? { exportName: completedContext.currentFunctionExportName } : {}),
		wasmIndex,
		typeIndex: completedContext.currentFunctionTypeIndex,
		ast,
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
	};
}
