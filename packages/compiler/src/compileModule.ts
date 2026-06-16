import type {
	CompiledModule,
	CompiledStackAnalysisLine,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	ModuleCompilationContext,
	Namespaces,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
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
import { compileCodegenLine, toCompiledStackAnalysisLine } from './compileLine';
import { getError } from './compilerError';
import { applySemanticLine } from './semantic/buildNamespace';
import { createCompilationContext } from './semantic/createCompilationContext';
import { getMemoryRegionFields } from './semantic/memoryRegions';
import { createMemoryMapFromPlan } from './semantic/memoryState';
import normalizeValueArguments from './semantic/normalizeValueArguments';
import { analyzeInstruction } from './stackAnalysis/analyzeInstruction';

/**
 * Compiles one validated module AST into its WebAssembly cycle function and memory metadata.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param index - WASM index or source index assigned to the compiled item.
 * @param functions - Function registry available to compilation.
 * @param options - Compiler options for this compilation pass.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The compiled module artifact.
 */
export function compileModule(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	index: number,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'includeStackAnalysis' | 'memoryRegions'> = {},
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>,
	memoryPlan?: MemoryLayoutPlan
): CompiledModule {
	const namespace = namespaces[ast.id];
	const plannedModule = memoryPlan?.modules[ast.id];
	const memoryIndex = namespace?.memoryIndex ?? 0;
	const memoryRegionName = namespace?.memoryRegionName;
	const moduleWordAlignedSize = plannedModule?.wordAlignedSize ?? namespace?.wordAlignedSize ?? 0;
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
		startingByteAddress,
		currentModuleNextWordOffset: moduleWordAlignedSize,
		currentModuleWordAlignedSize: moduleWordAlignedSize,
		currentMemoryIndex: memoryIndex,
		...(memoryRegionName ? { currentMemoryRegionName: memoryRegionName } : {}),
		...(memoryPlan ? { memoryPlan } : {}),
		currentPlannedModule: plannedModule,
		currentPlannedMemoryDeclarationIndex: 0,
		memoryDefaults: namespace?.memoryDefaults ?? {},
		pointerMetadata: namespace?.pointerMetadata ?? {},
		memoryRegions: options.memoryRegions ?? [],
		mode: 'module',
		functionTypeRegistry: typeRegistry,
		prototypeShapes,
		projectBlockId: ast.projectBlockId,
		source: ast.source,
	});

	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	for (const originalLine of ast.lines) {
		const line = normalizeValueArguments(originalLine, context);
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
		throw getError(
			ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS,
			ast.lines[0] ?? {
				lineNumber: 0,
				instruction: 'block',
				arguments: [],
			},
			context
		);
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
		initFunctionBody: [],
		...getMemoryRegionFields(memoryIndex, memoryRegionName),
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: createMemoryMapFromPlan(plannedModule, context),
		wordAlignedSize: context.currentModuleWordAlignedSize,
		ast,
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
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
