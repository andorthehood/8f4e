import {
	ArgumentType,
	type CompilationContext,
	type CompileOptions,
	type CompilerDiagnosticContext,
	compilerSourceBlockInstructionByType,
	createFunctionId,
	ErrorCode,
	type FunctionMetadata,
	type FunctionMetadataLookup,
	type FunctionRegistry,
	GLOBAL_ALIGNMENT_BOUNDARY,
	isArrayMemoryDeclarationLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	type MemoryDeclarationLine,
	type NamespaceBuildContext,
	type Namespaces,
	type SemanticInstructionLine,
	type ShapeLine,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import type { ResolveMemoryDefaultsResult } from '@8f4e/memory-default-resolver';
import { type MemoryLayoutPlan, type MemoryLayoutSourceModule, planMemoryLayout } from '@8f4e/memory-planner';
import { getError } from '../compilerError';
import { createCompilationContext } from './createCompilationContext';
import applySemanticInstruction from './instructions';
import { getDefaultMemoryRegion, getMemoryRegionFields, validateMemoryRegionOptions } from './memoryRegions';
import {
	normalizeArgumentsAtIndexes,
	validateOrDeferUnresolvedIdentifier,
	validateOrDeferValueExpression,
} from './normalization/helpers';
import normalizeValueArguments from './normalizeValueArguments';
import { getEffectiveFunctionMetadata } from './paramShape';

const moduleBlock = compilerSourceBlockInstructionByType.module;

function getAstDiagnosticContext(
	ast: ValidatedFunctionAST | ValidatedModuleAST | ValidatedPrototypeAST
): CompilerDiagnosticContext {
	return {
		codeBlockType: ast.type,
		...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
	};
}

/** Inputs for collecting function metadata and validating whole-program function names. */
type FunctionMetadataCollectionOptions = {
	importedFunctionBaseIndex: number;
	definedFunctionBaseIndex: number;
	reservedFunctionIds: readonly string[];
	reservedExportNames: readonly string[];
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>;
};

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic normalization (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 *
 * @param asts - Validated ASTs being processed.
 * @param options - Compiler options for this compilation pass.
 * @returns The computed result.
 */
export function collectFunctionMetadataFromAsts(
	asts: readonly ValidatedFunctionAST[],
	options: FunctionMetadataCollectionOptions
): FunctionRegistry {
	const byId: FunctionMetadataLookup = {};
	const arityByName: FunctionRegistry['arityByName'] = {};
	const overloadCountsByName = asts.reduce<Record<string, number>>((counts, ast) => {
		counts[ast.name] = (counts[ast.name] ?? 0) + 1;
		return counts;
	}, {});
	const seenFunctionIds = new Set(options.reservedFunctionIds);
	const reservedFunctionNames = new Set(options.reservedFunctionIds);
	const seenExportNames = new Set(options.reservedExportNames);
	let importedFunctionIndex = 0;
	let definedFunctionIndex = 0;

	for (const ast of asts) {
		const name = ast.name;
		const functionMetadata = getEffectiveFunctionMetadata(ast, options.prototypeShapes);
		const id = createFunctionId(name, functionMetadata.signature.parameters);
		if (reservedFunctionNames.has(name)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.functionLine, getAstDiagnosticContext(ast), {
				identifier: name,
			});
		}
		if (seenFunctionIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_FUNCTION_SIGNATURE, ast.functionLine, getAstDiagnosticContext(ast), {
				identifier: id,
			});
		}

		const existingArity = arityByName[name];
		const arity = functionMetadata.signature.parameters.length;
		if (existingArity !== undefined) {
			if (existingArity === 0 || arity === 0 || existingArity !== arity) {
				throw getError(ErrorCode.INVALID_FUNCTION_OVERLOAD_SET, ast.functionLine, getAstDiagnosticContext(ast), {
					identifier: name,
				});
			}
		}

		const importedFunction = ast.import;
		// Imported functions cannot be valid exports; keep that conflict in per-function directive validation.
		const exportName = importedFunction ? undefined : ast.exportName;
		if (exportName && overloadCountsByName[name] > 1) {
			throw getError(
				ErrorCode.OVERLOADED_FUNCTION_EXPORT_UNSUPPORTED,
				ast.exportLine ?? ast.functionLine,
				getAstDiagnosticContext(ast),
				{
					identifier: name,
				}
			);
		}
		if (exportName) {
			if (seenExportNames.has(exportName)) {
				throw getError(
					ErrorCode.DUPLICATE_EXPORT_NAME,
					ast.exportLine ?? ast.functionLine,
					getAstDiagnosticContext(ast),
					{
						identifier: exportName,
					}
				);
			}
			seenExportNames.add(exportName);
		}

		const metadata: FunctionMetadata = {
			id,
			name,
			signature: functionMetadata.signature,
			wasmIndex: importedFunction
				? options.importedFunctionBaseIndex + importedFunctionIndex++
				: options.definedFunctionBaseIndex + definedFunctionIndex++,
			...(exportName ? { used: true } : {}),
			...(importedFunction ? { import: importedFunction } : {}),
			...(functionMetadata.paramShapeExpansions ? { paramShapeExpansions: functionMetadata.paramShapeExpansions } : {}),
		};
		seenFunctionIds.add(id);
		byId[id] = metadata;
		arityByName[name] = arity;
	}

	return { byId, arityByName };
}

/**
 * Ensures module source blocks declare unique ids before namespace discovery.
 *
 * @param asts - Validated ASTs being processed.
 * @returns Nothing.
 */
export function assertUniqueModuleIds(asts: readonly ValidatedModuleAST[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		const id = ast.id;
		if (seenModuleIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.moduleLine, getAstDiagnosticContext(ast), { identifier: id });
		}
		seenModuleIds.add(id);
	}
}

/**
 * Normalizes and applies one semantic instruction, trusting tokenizer placement validation.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function applySemanticLine(line: SemanticInstructionLine, context: CompilationContext) {
	const normalizedLine = normalizeValueArguments(line, context);
	applySemanticInstruction(normalizedLine, context);
}

function createLayoutSourceBuildContext(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): NamespaceBuildContext {
	const currentMemoryRegion = getDefaultMemoryRegion();
	return createCompilationContext<NamespaceBuildContext>({
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
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: currentMemoryRegion.memoryIndex,
		...(currentMemoryRegion.memoryRegionName ? { currentMemoryRegionName: currentMemoryRegion.memoryRegionName } : {}),
		memoryDefaults: {},
		pointerMetadata: {},
		memoryRegions: options.memoryRegions ?? [],
		mode: moduleBlock.type,
		codeBlockType: ast.type,
		projectBlockId: ast.projectBlockId,
	});
}

function isShapeLine(line: SemanticInstructionLine): line is ShapeLine {
	return line.instruction === 'shape';
}

function normalizeLayoutMemoryDeclarationLine(
	line: MemoryDeclarationLine,
	context: NamespaceBuildContext
): MemoryDeclarationLine {
	if (!isArrayMemoryDeclarationLine(line)) {
		return line;
	}

	const { line: normalizedLine } = normalizeArgumentsAtIndexes(line, context, [1]);
	const elementCount = normalizedLine.arguments[1];
	if (elementCount.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferValueExpression(elementCount, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${elementCount.left.value}${elementCount.operator}${elementCount.right.value}`,
			});
		}
	}
	if (elementCount.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(elementCount, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: elementCount.value });
		}
	}

	return normalizedLine;
}

function appendLayoutMemoryDeclarationLine(
	sourceModule: MemoryLayoutSourceModule,
	context: NamespaceBuildContext,
	line: MemoryDeclarationLine
): void {
	const normalizedLine = normalizeLayoutMemoryDeclarationLine(line, context);

	sourceModule.lines = [...sourceModule.lines, normalizedLine];
}

function appendLayoutShapeLine(sourceModule: MemoryLayoutSourceModule, line: ShapeLine): void {
	sourceModule.lines = [...sourceModule.lines, line];
}

function collectModuleMemoryLayoutSourceLines(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress: number,
	functions: FunctionRegistry | undefined,
	options: Pick<CompileOptions, 'memoryRegions'>
): MemoryLayoutSourceModule {
	const sourceModule: MemoryLayoutSourceModule = {
		id: ast.id,
		moduleLine: ast.moduleLine,
		...(ast.regionLine ? { regionLine: ast.regionLine } : {}),
		lines: [],
	};
	const context = createLayoutSourceBuildContext(ast, namespaces, startingByteAddress, functions, options);

	for (const line of ast.lines) {
		if (isMemoryDeclarationLine(line)) {
			appendLayoutMemoryDeclarationLine(sourceModule, context, line);
			continue;
		}

		if (!isSemanticInstructionLine(line)) {
			continue;
		}

		if (!isShapeLine(line)) {
			applySemanticLine(line, context);
			continue;
		}

		appendLayoutShapeLine(sourceModule, line);
	}

	return sourceModule;
}

function createMemoryLayoutSourceModules(
	asts: readonly ValidatedModuleAST[],
	namespaces: Namespaces,
	startingByteAddress: number,
	functions: FunctionRegistry | undefined,
	options: Pick<CompileOptions, 'memoryRegions'>
): MemoryLayoutSourceModule[] {
	return asts.map(ast =>
		collectModuleMemoryLayoutSourceLines(ast, namespaces, startingByteAddress, functions, options)
	);
}

/**
 * Creates the whole-project memory layout plan used by namespace collection and
 * memory reference inlining.
 *
 * @param asts - Validated module ASTs being processed.
 * @param prototypes - Validated prototype ASTs available for shape expansion.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param options - Compiler options for this compilation pass.
 * @returns Planned module and memory declaration layout.
 */
export function createMemoryLayoutPlanFromASTs(
	asts: readonly ValidatedModuleAST[],
	prototypes: readonly ValidatedPrototypeAST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): MemoryLayoutPlan {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	return planMemoryLayout({
		prototypes,
		modules: createMemoryLayoutSourceModules(asts, namespaces, startingByteAddress, compiledFunctions, options),
		startingByteAddress,
		memoryRegions: options.memoryRegions ?? [],
	});
}

/**
 * Discovers planned namespaces for modules.
 *
 * @param asts - Validated ASTs being processed.
 * @param memoryPlan - Completed memory layout plan for the project.
 * @param defaultResolution - Resolved defaults and pointer metadata keyed by module id.
 * @param options - Compiler options for this compilation pass.
 * @returns The computed result.
 */
export function collectNamespacesFromASTs(
	asts: readonly ValidatedModuleAST[],
	memoryPlan: MemoryLayoutPlan,
	defaultResolution: ResolveMemoryDefaultsResult,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	for (const plannedModule of memoryPlan.moduleList) {
		namespaces[plannedModule.id] = {
			kind: moduleBlock.type,
			...getMemoryRegionFields(plannedModule.memoryIndex, plannedModule.memoryRegionName),
			byteAddress: plannedModule.byteAddress,
			wordAlignedSize: plannedModule.wordAlignedSize,
			isMemoryLayoutFinalized: true,
			memoryDefaults: defaultResolution.memoryDefaultsByModuleId[plannedModule.id]!,
			pointerMetadata: defaultResolution.pointerMetadataByModuleId[plannedModule.id]!,
		};
	}

	return namespaces;
}
