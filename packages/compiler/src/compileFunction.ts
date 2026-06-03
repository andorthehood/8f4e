import type {
	AnalyzedLine,
	CompiledFunction,
	CompiledStackAnalysisLine,
	CompileOptions,
	FunctionCompilationContext,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	Namespaces,
	ValidatedFunctionAST,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { compileLine, toCompiledStackAnalysisLine } from './compileLine';
import { getError } from './compilerError';
import instructions from './instructionCompilers';
import { createCompilationContext } from './semantic/createCompilationContext';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';

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

/** Compiles one validated function AST into a WebAssembly function body or import metadata. */
export function compileFunction(
	ast: ValidatedFunctionAST,
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
