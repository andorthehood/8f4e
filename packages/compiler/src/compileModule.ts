import type {
	CompiledModule,
	CompiledShapeExpansion,
	CompiledStackAnalysisLine,
	CompileOptions,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	ModuleCompilationContext,
	Namespaces,
	ValidatedConstantsAST,
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
import { applySemanticLine, layoutNamespace } from './semantic/buildNamespace';
import { createCompilationContext } from './semantic/createCompilationContext';
import { getMemoryRegionFields } from './semantic/memoryRegions';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { analyzeInstruction } from './stackAnalysis/analyzeInstruction';

function collectShapeExpansions(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledShapeExpansion[] | undefined {
	if (ast.type !== 'module') {
		return undefined;
	}

	const shapeExpansions = ast.lines.flatMap(line => {
		if (line.instruction !== 'shape') {
			return [];
		}

		const prototypeId = line.arguments[0].value;
		const memoryDeclarationLines = prototypeShapes?.[prototypeId]?.memoryDeclarationLines ?? [];
		return memoryDeclarationLines.length > 0
			? [
					{
						lineNumber: line.lineNumber,
						prototypeId,
						memoryDeclarationLines,
					},
				]
			: [];
	});

	return shapeExpansions.length > 0 ? shapeExpansions : undefined;
}

/**
 * Compiles one validated module or constants AST into its WebAssembly cycle function and memory metadata.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param index - WASM index or source index assigned to the compiled item.
 * @param functions - Function metadata lookup available to compilation.
 * @param internalAllocator - Allocator state for compiler-generated memory resources.
 * @param options - Compiler options for this compilation pass.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The compiled module artifact.
 */
export function compileModule(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	index: number,
	functions?: FunctionMetadataLookup,
	internalAllocator = { nextByteAddress: 0 },
	options: Pick<CompileOptions, 'includeStackAnalysis' | 'memoryRegions'> = {},
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledModule {
	// Namespace layout establishes memory byte addresses and sizes for this module.
	// Semantic instructions (const, use, module/moduleEnd) are applied during
	// the compilation loop below, so consts are not copied from the layout context.
	const layoutContext = layoutNamespace(ast, namespaces, startingByteAddress, functions, options, prototypeShapes);
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
		projectBlockId: ast.projectBlockId,
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

	const internalResources = Object.keys(context.internalResources).length > 0 ? context.internalResources : undefined;
	const shapeExpansions = collectShapeExpansions(ast, prototypeShapes);

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
		...(shapeExpansions ? { shapeExpansions } : {}),
		...(options.includeStackAnalysis ? { stackAnalysis } : {}),
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
	};
}
