import {
	ArgumentType,
	type CompilationContext,
	type CompileOptions,
	type CompilerASTLine,
	type CompilerDiagnosticContext,
	compilerSourceBlockInstructionByType,
	createFunctionId,
	ErrorCode,
	type FunctionMetadata,
	type FunctionMetadataLookup,
	type FunctionRegistry,
	GLOBAL_ALIGNMENT_BOUNDARY,
	hasReferencedNamespaceIds,
	isArrayMemoryDeclarationLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	type MemoryDeclarationLine,
	type MemoryMap,
	type NamespaceBuildContext,
	type Namespaces,
	type SemanticInstructionLine,
	type ShapeLine,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import {
	type MemoryLayoutSourceModule,
	type PlannedMemoryDeclaration,
	type PlannedMemoryModule,
	planMemoryLayout,
} from '@8f4e/memory-planner';
import { getError } from '../compilerError';
import { createCompilationContext } from './createCompilationContext';
import { applyMemoryDeclarationLine } from './declarations';
import applySemanticInstruction from './instructions';
import { getDefaultMemoryRegion, getMemoryRegionFields, validateMemoryRegionOptions } from './memoryRegions';
import {
	normalizeArgumentsAtIndexes,
	validateOrDeferUnresolvedIdentifier,
	validateOrDeferValueExpression,
} from './normalization/helpers';
import normalizeValueArguments from './normalizeValueArguments';
import { getEffectiveFunctionMetadata } from './paramShape';
import parseMemoryInstructionArguments from './utils/memoryInstructionParser';

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

function createNamespaceBuildContext(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>,
	plannedModule?: PlannedMemoryModule
): NamespaceBuildContext {
	const defaultRegion = getDefaultMemoryRegion();
	const currentMemoryRegion = plannedModule ?? defaultRegion;
	return createCompilationContext<NamespaceBuildContext>({
		namespace: {
			namespaces,
			memory: {},
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
		currentModuleWordAlignedSize: plannedModule?.wordAlignedSize ?? 0,
		currentMemoryIndex: currentMemoryRegion.memoryIndex,
		...(currentMemoryRegion.memoryRegionName ? { currentMemoryRegionName: currentMemoryRegion.memoryRegionName } : {}),
		memoryLayoutDeclarations: plannedModule?.declarations,
		currentMemoryLayoutDeclarationIndex: 0,
		memoryRegions: options.memoryRegions ?? [],
		mode: moduleBlock.type,
		codeBlockType: ast.type,
		projectBlockId: ast.projectBlockId,
		prototypeShapes,
		expandPrototypeShapes: true,
	});
}

function applyNamespaceDeclarationLines(ast: ValidatedModuleAST, context: NamespaceBuildContext): void {
	ast.lines.forEach(originalLine => {
		if (isSemanticInstructionLine(originalLine)) {
			applySemanticLine(originalLine, context);
		} else if (isMemoryDeclarationLine(originalLine)) {
			applyMemoryDeclarationLine(normalizeValueArguments(originalLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;
}

function applyNamespaceDiscoveryLines(
	ast: ValidatedModuleAST,
	context: NamespaceBuildContext,
	plannedModule?: PlannedMemoryModule
): void {
	ast.lines.forEach(line => {
		if (!isSemanticInstructionLine(line)) {
			return;
		}

		if (!isShapeLine(line)) {
			applySemanticLine(line, context);
			return;
		}

		const prototypeId = line.arguments[0].value;
		if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
			context.namespace.prototypeShapeIds.push(prototypeId);
		}
		if (!context.prototypeShapes?.[prototypeId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
		}
	});

	if (!plannedModule) {
		return;
	}

	context.namespace.memory = createLayoutOnlyMemoryMap(plannedModule.memory);
	context.currentModuleNextWordOffset = plannedModule.wordAlignedSize;
	context.currentModuleWordAlignedSize = plannedModule.wordAlignedSize;
}

function resolveScalarMemoryDefaults(ast: ValidatedModuleAST, context: NamespaceBuildContext): void {
	ast.lines.forEach(originalLine => {
		if (!isMemoryDeclarationLine(originalLine) || originalLine.instruction.endsWith('[]')) {
			return;
		}

		const line = normalizeValueArguments(originalLine, context);
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			return;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	});
}

function discoverNamespace(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>,
	plannedModule?: PlannedMemoryModule
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		startingByteAddress,
		functions,
		options,
		prototypeShapes,
		plannedModule
	);
	applyNamespaceDiscoveryLines(ast, context, plannedModule);

	return context;
}

/**
 * Applies semantic declarations and resolves scalar defaults for one namespace AST.
 *
 * @param ast - Validated AST being processed.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param functions - Function registry available to compilation.
 * @param options - Compiler options for this compilation pass.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The computed result.
 */
export function layoutNamespace(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>,
	plannedModule?: PlannedMemoryModule
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		startingByteAddress,
		functions,
		options,
		prototypeShapes,
		plannedModule
	);
	applyNamespaceDeclarationLines(ast, context);
	resolveScalarMemoryDefaults(ast, context);

	return context;
}

function shouldDeferNamespaceCollection(
	error: unknown,
	line: CompilerASTLine | undefined,
	namespaces: Namespaces
): boolean {
	if (!line || typeof error !== 'object' || error === null || !('code' in error)) {
		return false;
	}

	if (error.code !== ErrorCode.UNDECLARED_IDENTIFIER) {
		return false;
	}

	return hasReferencedNamespaceIds(line) && line.referencedNamespaceIds.some(namespaceId => !namespaces[namespaceId]);
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

function createLayoutOnlyMemoryMap(memory: Record<string, PlannedMemoryDeclaration>): MemoryMap {
	const layoutMemory: MemoryMap = {};

	for (const [id, declaration] of Object.entries(memory)) {
		layoutMemory[id] = {
			...declaration,
			default: 0,
			isInherited: false,
		};
	}

	return layoutMemory;
}

function appendLayoutMemoryDeclarationLine(
	sourceModule: MemoryLayoutSourceModule,
	context: NamespaceBuildContext,
	line: MemoryDeclarationLine
): void {
	const normalizedLine = normalizeLayoutMemoryDeclarationLine(line, context);

	sourceModule.memoryDeclarationLines = [...sourceModule.memoryDeclarationLines, normalizedLine];
}

function collectModuleMemoryDeclarationLines(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress: number,
	functions: FunctionRegistry | undefined,
	options: Pick<CompileOptions, 'memoryRegions'>,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>> | undefined
): MemoryLayoutSourceModule {
	const sourceModule: MemoryLayoutSourceModule = {
		id: ast.id,
		moduleLine: ast.moduleLine,
		...(ast.regionLine ? { regionLine: ast.regionLine } : {}),
		memoryDeclarationLines: [],
	};
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		startingByteAddress,
		functions,
		options,
		prototypeShapes
	);

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

		const prototypeId = line.arguments[0].value;
		const prototype = prototypeShapes?.[prototypeId];
		if (!prototype) {
			continue;
		}

		for (const declarationLine of prototype.memoryDeclarationLines) {
			appendLayoutMemoryDeclarationLine(sourceModule, context, {
				...declarationLine,
				lineNumber: line.lineNumber,
			});
		}
	}

	return sourceModule;
}

function createMemoryLayoutSourceModules(
	asts: readonly ValidatedModuleAST[],
	namespaces: Namespaces,
	startingByteAddress: number,
	functions: FunctionRegistry | undefined,
	options: Pick<CompileOptions, 'memoryRegions'>,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>> | undefined
): MemoryLayoutSourceModule[] {
	return asts.map(ast =>
		collectModuleMemoryDeclarationLines(ast, namespaces, startingByteAddress, functions, options, prototypeShapes)
	);
}

/**
 * Discovers and lays out namespaces for modules and constants, deferring intermodule dependencies as needed.
 *
 * @param asts - Validated ASTs being processed.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param layoutAsts - layout asts value to use.
 * @param options - Compiler options for this compilation pass.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The computed result.
 */
export function collectNamespacesFromASTs(
	asts: readonly ValidatedModuleAST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: FunctionRegistry,
	layoutAsts: readonly ValidatedModuleAST[] = asts,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};
	const memoryPlan = planMemoryLayout({
		modules: createMemoryLayoutSourceModules(
			layoutAsts,
			namespaces,
			startingByteAddress,
			compiledFunctions,
			options,
			prototypeShapes
		),
		startingByteAddress,
		memoryRegions: options.memoryRegions ?? [],
	});

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: ValidatedModuleAST[] = [];

		for (const ast of pendingAsts) {
			try {
				const context = discoverNamespace(
					ast,
					namespaces,
					startingByteAddress,
					compiledFunctions,
					options,
					prototypeShapes,
					memoryPlan.modules[ast.id]
				);
				if (!context.namespace.moduleName) {
					continue;
				}
				namespaces[context.namespace.moduleName] = {
					kind: ast.type,
					memory: context.namespace.memory,
					...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
					...(memoryPlan.modules[ast.id]
						? {
								byteAddress: memoryPlan.modules[ast.id].byteAddress,
								wordAlignedSize: memoryPlan.modules[ast.id].wordAlignedSize,
								isMemoryLayoutFinalized: false,
							}
						: {}),
				};
				madeProgress = true;
			} catch (error) {
				const failingLine =
					typeof error === 'object' && error !== null && 'line' in error ? (error.line as CompilerASTLine) : undefined;
				if (shouldDeferNamespaceCollection(error, failingLine, namespaces)) {
					deferredAsts.push(ast);
					continue;
				}
				throw error;
			}
		}

		pendingAsts = deferredAsts;
	}

	if (pendingAsts.length > 0) {
		layoutNamespace(
			pendingAsts[0],
			namespaces,
			startingByteAddress,
			compiledFunctions,
			options,
			prototypeShapes,
			memoryPlan.modules[pendingAsts[0].id]
		);
	}

	for (const plannedModule of memoryPlan.moduleList) {
		const ast = layoutAsts.find(candidate => candidate.id === plannedModule.id);
		if (!ast) {
			continue;
		}
		const context = layoutNamespace(
			ast,
			namespaces,
			plannedModule.byteAddress,
			compiledFunctions,
			options,
			prototypeShapes,
			plannedModule
		);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			kind: moduleBlock.type,
			memory: context.namespace.memory,
			...getMemoryRegionFields(plannedModule.memoryIndex, plannedModule.memoryRegionName),
			byteAddress: plannedModule.byteAddress,
			wordAlignedSize: plannedModule.wordAlignedSize,
			isMemoryLayoutFinalized: true,
		};
	}

	return namespaces;
}
