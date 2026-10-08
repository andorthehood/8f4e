import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import type {
	CodegenContext,
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	Namespaces,
	ValidatedModuleAST,
} from '@8f4e/language-spec';

import { BlockType } from '@8f4e/language-spec';
import type { ModuleSemanticReferences } from '@8f4e/semantic-reference-resolver';
import type { StackAnalyzedModule } from '@8f4e/stack-analyzer';
import { compileCodegenLine } from './compileLine';
import { createCodegenContext } from './createCodegenContext';

/**
 * Compiles one resolved module into its WebAssembly cycle function and memory metadata.
 *
 * @param resolved - Executable body, source bindings, and module metadata.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param memoryPlan - Completed memory layout plan for the sub-program.
 * @param index - WASM index or source index assigned to the compiled item.
 * @param functions - Function registry available to compilation.
 * @param options - Compiler options for this compilation pass.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param stackReport - Stack-analysis report for this module.
 * @returns The compiled module artifact.
 */
export function compileModule(
	resolved: ModuleSemanticReferences,
	namespaces: Namespaces,
	memoryPlan: MemoryLayoutPlan,
	index: number,
	functions: FunctionRegistry | undefined,
	stackReport: StackAnalyzedModule,
	options: Pick<CompileOptions, 'includeStackAnalysis'> = {},
	typeRegistry?: FunctionTypeRegistry
): CompiledModule {
	const { ast, bindings, body } = resolved;
	const namespace = namespaces[ast.id];
	const plannedModule = memoryPlan.modules[ast.id];
	const memoryIndex = plannedModule.memoryIndex;
	const memoryRegionName = plannedModule.memoryRegionName;
	const moduleWordAlignedSize = plannedModule.wordAlignedSize;
	const context = createCodegenContext<CodegenContext>(
		{
			namespace: {
				namespaces,
				moduleName: ast.id,
				functions,
				prototypeShapeIds: [],
			},
			byteCode: [],
			blockStack: [{ blockType: BlockType.MODULE, expectedResultTypes: [] }],
			startingByteAddress: plannedModule.byteAddress,
			currentModuleNextWordOffset: moduleWordAlignedSize,
			currentModuleWordAlignedSize: moduleWordAlignedSize,
			currentMemoryIndex: memoryIndex,
			...(memoryRegionName ? { currentMemoryRegionName: memoryRegionName } : {}),
			memoryPlan,
			currentPlannedModule: plannedModule,
			memoryDefaults: namespace.memoryDefaults,
			pointerMetadata: namespace.pointerMetadata,
			mode: 'module',
			functionTypeRegistry: typeRegistry,
			codeBlockId: ast.id,
			codeBlockType: 'module',
			projectBlockId: ast.projectBlockId,
			source: ast.source,
		},
		bindings
	);

	for (const { sourceLineIndex, line } of body)
		compileCodegenLine(line, stackReport.lineFacts[sourceLineIndex]!, context);

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
		ast: ast as ValidatedModuleAST,
		...(options.includeStackAnalysis ? { stackAnalysis: stackReport.stackAnalysis } : {}),
		index,
		...(resolved.skipExecutionInCycle ? { skipExecutionInCycle: true } : {}),
	};
}
