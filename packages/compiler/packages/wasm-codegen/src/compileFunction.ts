import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import type {
	CompiledFunction,
	CompileOptions,
	FunctionCompilationContext,
	FunctionRegistry,
	FunctionTypeRegistry,
	Namespaces,
	ValidatedFunctionAST,
} from '@8f4e/language-spec';
import { isMemoryDeclarationLine, isSemanticInstructionLine } from '@8f4e/language-spec';
import type { FunctionSemanticReferences } from '@8f4e/semantic-reference-resolver';
import { createCompilationContext } from '@8f4e/semantic-utils';
import type { StackAnalyzedFunction } from '@8f4e/stack-analyzer';
import { compileCodegenLine } from './compileLine';

/**
 * Compiles one validated function AST into a WebAssembly function body or import metadata.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param functions - Function registry available to compilation.
 * @param stackReport - Stack-analysis report for this function.
 * @param options - Compiler options for this compilation pass.
 * @returns The compiled function artifact.
 */
export function compileFunction(
	ast: ValidatedFunctionAST,
	namespaces: Namespaces,
	typeRegistry: FunctionTypeRegistry,
	functions: FunctionRegistry,
	semanticReferences: FunctionSemanticReferences,
	stackReport: StackAnalyzedFunction,
	options: Pick<CompileOptions, 'includeStackAnalysis'> = {}
): CompiledFunction {
	const functionMetadata = functions.byId[stackReport.functionId]!;
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

	for (const [lineIndex, sourceLine] of ast.lines.entries()) {
		if (isSemanticInstructionLine(sourceLine) || isMemoryDeclarationLine(sourceLine)) {
			continue;
		}
		compileCodegenLine(sourceLine, semanticReferences.lineFacts[lineIndex], stackReport.lineFacts[lineIndex]!, context);
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

	return {
		id: functionMetadata.id,
		name: functionMetadata.name,
		signature: functionMetadata.signature,
		body: context.currentFunctionImport
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
		locals: context.currentFunctionImport ? [] : localDeclarations,
		...(context.currentFunctionExportName ? { exportName: context.currentFunctionExportName } : {}),
		...(context.currentFunctionImport ? { import: context.currentFunctionImport } : {}),
		wasmIndex: functionMetadata.wasmIndex,
		typeIndex: context.currentFunctionTypeIndex!,
		ast,
		...(stackReport.used ? { used: true } : {}),
		...(functionMetadata.paramShapeExpansions ? { paramShapeExpansions: functionMetadata.paramShapeExpansions } : {}),
		...(options.includeStackAnalysis ? { stackAnalysis: stackReport.stackAnalysis } : {}),
	};
}
