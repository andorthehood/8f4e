import type {
	AnalyzedLine,
	CompiledFunction,
	CompiledStackAnalysisLine,
	CompileOptions,
	FunctionCompilationContext,
	FunctionMetadata,
	FunctionRegistry,
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
import normalizeValueArguments from './semantic/normalizeValueArguments';

type CompletedFunctionCompilationContext = FunctionCompilationContext & {
	currentFunctionTypeIndex: number;
};

const importedFunctionAllowedInstructions = new Set([
	'function',
	'#import',
	'#impure',
	'#loopCap',
	'param',
	'paramShape',
	'functionEnd',
]);

/**
 * Compiles one validated function AST into a WebAssembly function body or import metadata.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param functionMetadata - Metadata for the function being compiled.
 * @param functions - Function registry available to compilation.
 * @param options - Compiler options for this compilation pass.
 * @returns The compiled function artifact.
 */
export function compileFunction(
	ast: ValidatedFunctionAST,
	namespaces: Namespaces,
	typeRegistry: FunctionTypeRegistry,
	functionMetadata: FunctionMetadata,
	functions: FunctionRegistry,
	options: Pick<CompileOptions, 'includeStackAnalysis'> = {}
): CompiledFunction {
	const context = createCompilationContext<FunctionCompilationContext>({
		namespace: {
			namespaces,
			moduleName: undefined,
			functions,
			prototypeShapeIds: [],
		},
		locals: {},
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
		projectBlockId: ast.projectBlockId,
		source: ast.source,
		currentFunctionId: functionMetadata.id,
		currentFunctionName: functionMetadata.name,
		currentFunctionMetadata: functionMetadata,
		currentFunctionParameterCount: 0,
		functionTypeRegistry: typeRegistry,
	});

	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	for (const originalLine of ast.lines) {
		const line = normalizeValueArguments(originalLine, context);
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
	const parameterCount = context.currentFunctionParameterCount;
	const localDeclarations = Object.entries(context.locals)
		.filter(([, local]) => local.index >= parameterCount)
		.map(([, local]) => ({
			isInteger: local.isInteger,
			isFloat64: local.isFloat64,
			count: 1,
		}));

	const completedContext = context as CompletedFunctionCompilationContext;

	return {
		id: functionMetadata.id,
		name: functionMetadata.name,
		signature: functionMetadata.signature,
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
		wasmIndex: functionMetadata.wasmIndex,
		typeIndex: completedContext.currentFunctionTypeIndex,
		ast,
		...(functionMetadata.used ? { used: true } : {}),
		...(functionMetadata.paramShapeExpansions ? { paramShapeExpansions: functionMetadata.paramShapeExpansions } : {}),
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
	};
}
