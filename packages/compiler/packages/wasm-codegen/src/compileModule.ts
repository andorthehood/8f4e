import {
	createFunction,
	createLocalDeclaration,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import type {
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	ModuleCompilationContext,
	Namespaces,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { isMemoryDeclarationLine, isSemanticInstructionLine } from '@8f4e/language-spec';
import type { ModuleSemanticReferences } from '@8f4e/semantic-reference-resolver';
import { createCompilationContext } from '@8f4e/semantic-utils';
import type { StackAnalyzedModule } from '@8f4e/stack-analyzer';
import { applySemanticLine } from './applySemanticLine';
import { compileCodegenLine } from './compileLine';

/**
 * Compiles one validated module AST into its WebAssembly cycle function and memory metadata.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param memoryPlan - Completed memory layout plan for the project.
 * @param index - WASM index or source index assigned to the compiled item.
 * @param functions - Function registry available to compilation.
 * @param options - Compiler options for this compilation pass.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @param stackReport - Stack-analysis report for this module.
 * @returns The compiled module artifact.
 */
export function compileModule(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	memoryPlan: MemoryLayoutPlan,
	index: number,
	functions: FunctionRegistry | undefined,
	semanticReferences: ModuleSemanticReferences,
	stackReport: StackAnalyzedModule,
	options: Pick<CompileOptions, 'includeStackAnalysis' | 'memoryRegions'> = {},
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledModule {
	const namespace = namespaces[ast.id];
	const plannedModule = memoryPlan.modules[ast.id];
	const memoryIndex = plannedModule.memoryIndex;
	const memoryRegionName = plannedModule.memoryRegionName;
	const moduleWordAlignedSize = plannedModule.wordAlignedSize;
	const context = createCompilationContext<ModuleCompilationContext>({
		namespace: {
			namespaces,
			moduleName: undefined,
			functions,
			prototypeShapeIds: collectPrototypeShapeIds(ast),
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: plannedModule.byteAddress,
		currentModuleNextWordOffset: moduleWordAlignedSize,
		currentModuleWordAlignedSize: moduleWordAlignedSize,
		currentMemoryIndex: memoryIndex,
		...(memoryRegionName ? { currentMemoryRegionName: memoryRegionName } : {}),
		memoryPlan,
		currentPlannedModule: plannedModule,
		memoryDefaults: namespace.memoryDefaults,
		pointerMetadata: namespace.pointerMetadata,
		memoryRegions: options.memoryRegions ?? [],
		mode: 'module',
		functionTypeRegistry: typeRegistry,
		prototypeShapes,
		projectBlockId: ast.projectBlockId,
		source: ast.source,
	});

	for (const [lineIndex, sourceLine] of ast.lines.entries()) {
		if (isSemanticInstructionLine(sourceLine)) {
			applySemanticLine(sourceLine, context);
		} else if (!isMemoryDeclarationLine(sourceLine)) {
			compileCodegenLine(
				sourceLine,
				semanticReferences.lineFacts[lineIndex],
				stackReport.lineFacts[lineIndex]!,
				context
			);
		}
	}

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
		ast,
		...(options.includeStackAnalysis ? { stackAnalysis: stackReport.stackAnalysis } : {}),
		index,
		skipExecutionInCycle: stackReport.skipExecutionInCycle,
	};
}

function collectPrototypeShapeIds(ast: ValidatedModuleAST): string[] {
	const prototypeShapeIds: string[] = [];
	for (const line of ast.lines) {
		if (line.instruction !== 'shape') {
			continue;
		}
		const prototypeId = line.arguments[0].value;
		if (!prototypeShapeIds.includes(prototypeId)) {
			prototypeShapeIds.push(prototypeId);
		}
	}
	return prototypeShapeIds;
}
