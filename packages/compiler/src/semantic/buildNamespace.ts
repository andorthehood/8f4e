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
	isMemoryDeclarationLine,
	isNamedScalarMemoryDeclarationLine,
	isSemanticInstructionLine,
	type MemoryDeclarationLine,
	type NamespaceBuildContext,
	type Namespaces,
	type SemanticInstructionLine,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { getError } from '../compilerError';
import { createCompilationContext } from './createCompilationContext';
import { applyMemoryDeclarationLine } from './declarations';
import applySemanticInstruction from './instructions';
import {
	DEFAULT_MEMORY_INDEX,
	getDefaultMemoryRegion,
	getMemoryRegionFields,
	resolveMemoryRegionByIndex,
	resolveMemoryRegionName,
	validateMemoryRegionOptions,
} from './memoryRegions';
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
	resolveMemoryDeclarationLine?: (line: MemoryDeclarationLine) => MemoryDeclarationLine
): NamespaceBuildContext {
	const defaultRegion = getDefaultMemoryRegion();
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
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: defaultRegion.memoryIndex,
		memoryRegions: options.memoryRegions ?? [],
		mode: moduleBlock.type,
		codeBlockType: ast.type,
		projectBlockId: ast.projectBlockId,
		prototypeShapes,
		expandPrototypeShapes: true,
		resolveMemoryDeclarationLine,
	});
}

function applyNamespaceDeclarationLines(ast: ValidatedModuleAST, context: NamespaceBuildContext): void {
	ast.lines.forEach(originalLine => {
		if (isSemanticInstructionLine(originalLine)) {
			applySemanticLine(originalLine, context);
		} else if (isMemoryDeclarationLine(originalLine)) {
			const declarationLine = context.resolveMemoryDeclarationLine?.(originalLine) ?? originalLine;
			applyMemoryDeclarationLine(normalizeValueArguments(declarationLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;
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
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		startingByteAddress,
		functions,
		options,
		prototypeShapes,
		toNamespaceDiscoveryMemoryDeclarationLine
	);
	applyNamespaceDeclarationLines(ast, context);

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
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		startingByteAddress,
		functions,
		options,
		prototypeShapes
	);
	applyNamespaceDeclarationLines(ast, context);
	resolveScalarMemoryDefaults(ast, context);

	return context;
}

function getModuleRegionFromAst(ast: ValidatedModuleAST, options: Pick<CompileOptions, 'memoryRegions'>) {
	if (!ast.regionLine) {
		return getDefaultMemoryRegion();
	}

	const [argument] = ast.regionLine.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, options.memoryRegions ?? [], ast.regionLine);
	}

	return resolveMemoryRegionName(argument.value, options.memoryRegions ?? [], ast.regionLine);
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

function toNamespaceDiscoveryMemoryDeclarationLine(line: MemoryDeclarationLine): MemoryDeclarationLine {
	if (!isNamedScalarMemoryDeclarationLine(line)) {
		return line;
	}

	const [identifier] = line.arguments;
	return {
		...line,
		arguments: [identifier],
	};
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
					prototypeShapes
				);
				if (!context.namespace.moduleName) {
					continue;
				}
				const existingNamespace = namespaces[context.namespace.moduleName];
				if (ast.type === moduleBlock.type && existingNamespace?.kind === moduleBlock.type) {
					throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.lines[0], context, {
						identifier: context.namespace.moduleName,
					});
				}
				namespaces[context.namespace.moduleName] = {
					kind: ast.type,
					memory: context.namespace.memory,
					...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
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
		layoutNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions, options, prototypeShapes);
	}

	const nextStartingByteAddressByMemoryIndex: Record<number, number> = {
		[DEFAULT_MEMORY_INDEX]: startingByteAddress,
	};
	for (const ast of layoutAsts) {
		const region = getModuleRegionFromAst(ast, options);
		const nextStartingByteAddress = nextStartingByteAddressByMemoryIndex[region.memoryIndex] ?? startingByteAddress;
		const context = layoutNamespace(
			ast,
			namespaces,
			nextStartingByteAddress,
			compiledFunctions,
			options,
			prototypeShapes
		);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			kind: moduleBlock.type,
			memory: context.namespace.memory,
			...getMemoryRegionFields(region.memoryIndex, region.memoryRegionName),
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: context.currentModuleWordAlignedSize,
		};

		nextStartingByteAddressByMemoryIndex[region.memoryIndex] =
			nextStartingByteAddress + context.currentModuleWordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}
