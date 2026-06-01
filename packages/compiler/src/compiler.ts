import type {
	AnalyzedLine,
	CompilationContext,
	CompiledFunction,
	CompiledModule,
	CompiledStackAnalysisLine,
	CompileOptions,
	CompilerASTLine,
	ConstantsAST,
	FunctionAST,
	FunctionCompilationContext,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	InstructionCompiler,
	ModuleAST,
	ModuleCompilationContext,
	Namespaces,
} from '@8f4e/compiler-spec';
import {
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
} from '@8f4e/compiler-spec';
import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { getError } from './compilerError';
import type { Instruction } from './instructionCompilers';
import instructions from './instructionCompilers';
import { applySemanticLine, layoutNamespace } from './semantic/buildNamespace';
import { createCompilationContext } from './semantic/createCompilationContext';
import { getMemoryRegionFields } from './semantic/memoryRegions';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { analyzeInstruction } from './stackAnalysis/analyzeInstruction';

type CompletedFunctionCompilationContext = FunctionCompilationContext & {
	currentFunctionId: string;
	currentFunctionTypeIndex: number;
};

const importedFunctionAllowedInstructions = new Set([
	'function',
	'#import',
	'#impure',
	'#loopCap',
	'param',
	'functionEnd',
]);

function getFallbackErrorLine(ast: { lines: readonly CompilerASTLine[] }): CompilerASTLine {
	return (
		ast.lines[0] ?? {
			lineNumber: 0,
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
		lineNumber: line.lineNumber,
		instruction: line.instruction,
		stackAnalysis: line.stackAnalysis,
	};
}

export function compileLine(line: CompilerASTLine, context: CompilationContext): AnalyzedLine | undefined {
	if (isMemoryDeclarationLine(line) && context.mode === 'function') {
		throw getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, line, context);
	}

	if (isSemanticInstructionLine(line)) {
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
	options: Pick<CompileOptions, 'includeStackAnalysis' | 'memoryRegions'> = {},
	typeRegistry?: FunctionTypeRegistry
): CompiledModule {
	// Namespace layout establishes memory byte addresses and sizes for this module.
	// Semantic instructions (const, use, module/moduleEnd) are applied during
	// the compilation loop below, so consts are not copied from the layout context.
	const layoutContext = layoutNamespace(ast, namespaces, startingByteAddress, functions, options);
	const namespace = namespaces[ast.id];
	const memoryIndex = namespace?.memoryIndex ?? layoutContext.currentMemoryIndex;
	const memoryRegionName = namespace?.memoryRegionName ?? layoutContext.currentMemoryRegionName;
	const context = createCompilationContext<ModuleCompilationContext>({
		namespace: {
			namespaces,
			memory: layoutContext.namespace.memory,
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
		currentModuleNextWordOffset: layoutContext.currentModuleNextWordOffset,
		currentModuleWordAlignedSize: layoutContext.currentModuleWordAlignedSize,
		currentMemoryIndex: memoryIndex,
		...(memoryRegionName ? { currentMemoryRegionName: memoryRegionName } : {}),
		memoryRegions: options.memoryRegions ?? [],
		mode: 'module',
		functionTypeRegistry: typeRegistry,
	});

	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	for (const originalLine of ast.lines) {
		const line = normalizeCompileTimeArguments(originalLine, context);
		if (isSemanticInstructionLine(line)) {
			applySemanticLine(line, context);
		} else if (!isMemoryDeclarationLine(line)) {
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
		if (ast.importLine && !importedFunctionAllowedInstructions.has(line.instruction)) {
			throw getError(
				line.instruction === '#export' ? ErrorCode.IMPORT_EXPORT_CONFLICT : ErrorCode.IMPORTED_FUNCTION_BODY,
				line,
				context
			);
		}

		if (ast.importLine && line.instruction === 'functionEnd') {
			instructions.functionEnd(line as AnalyzedLine, context);
			continue;
		}

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
		body: completedContext.currentFunctionImport
			? []
			: createFunction(
					localDeclarations.map(local =>
						createLocalDeclaration(
							local.isInteger ? WASM_TYPE_I32 : local.isFloat64 ? WASM_TYPE_F64 : WASM_TYPE_F32,
							local.count
						)
					),
					context.byteCode
				),
		locals: completedContext.currentFunctionImport ? [] : localDeclarations,
		...(completedContext.currentFunctionExportName ? { exportName: completedContext.currentFunctionExportName } : {}),
		...(completedContext.currentFunctionImport ? { import: completedContext.currentFunctionImport } : {}),
		wasmIndex,
		typeIndex: completedContext.currentFunctionTypeIndex,
		ast,
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
	};
}
