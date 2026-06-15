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
	isScalarMemoryDeclarationLine,
	isSemanticInstructionLine,
	type MemoryDeclarationLine,
	type NamespaceBuildContext,
	type Namespaces,
	type ScalarMemoryDeclarationLine,
	type SemanticInstructionLine,
	type ShapeLine,
	type ValidatedConstantsAST,
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
import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';
import { getEffectiveFunctionMetadata } from './paramShape';
import parseMemoryInstructionArguments from './utils/memoryInstructionParser';
import { applyPointerPointeeFields } from './utils/pointerPointeeFields';

const moduleBlock = compilerSourceBlockInstructionByType.module;

function getAstDiagnosticContext(
	ast: ValidatedFunctionAST | ValidatedModuleAST | ValidatedConstantsAST | ValidatedPrototypeAST
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

/** Context overrides used by namespace layout sub-passes. */
type NamespaceBuildOverrides = {
	/** Existing memory map to revisit instead of allocating a fresh one. */
	memory?: NamespaceBuildContext['namespace']['memory'];
	/** Current local word offset when resuming traversal over an existing layout. */
	currentModuleNextWordOffset?: number;
	/** Current module size when resolving `this&` address defaults. */
	currentModuleWordAlignedSize?: number;
	/** Optional source-line rewrite before semantic memory declaration handling. */
	resolveMemoryDeclarationLine?: (line: MemoryDeclarationLine) => MemoryDeclarationLine;
};

/** Callback used by the address-default pass for normalized scalar declarations. */
type ScalarMemoryDeclarationVisitor = (line: ScalarMemoryDeclarationLine, context: NamespaceBuildContext) => void;

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
export function assertUniqueModuleIds(asts: readonly (ValidatedModuleAST | ValidatedConstantsAST)[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		if (ast.type !== moduleBlock.type) {
			continue;
		}

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
	const normalizedLine = normalizeCompileTimeArguments(line, context);
	applySemanticInstruction(normalizedLine, context);
}

function createNamespaceBuildContext(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>,
	overrides: NamespaceBuildOverrides = {}
): NamespaceBuildContext {
	const defaultRegion = getDefaultMemoryRegion();
	return createCompilationContext<NamespaceBuildContext>({
		namespace: {
			namespaces,
			memory: overrides.memory ?? {},
			consts: {},
			moduleName: undefined,
			functions,
			prototypeShapeIds: [],
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: overrides.currentModuleNextWordOffset ?? 0,
		currentModuleWordAlignedSize: overrides.currentModuleWordAlignedSize ?? 0,
		currentMemoryIndex: defaultRegion.memoryIndex,
		memoryRegions: options.memoryRegions ?? [],
		mode: moduleBlock.type,
		codeBlockType: ast.type,
		projectBlockId: ast.projectBlockId,
		prototypeShapes,
		expandPrototypeShapes: true,
		resolveMemoryDeclarationLine: overrides.resolveMemoryDeclarationLine,
	});
}

function applyNamespaceDeclarationLines(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	context: NamespaceBuildContext
): void {
	const sourceBlockSpec = compilerSourceBlockInstructionByType[ast.type];
	const shouldValidateUnhandledLines = sourceBlockSpec.compilationMode === null;

	ast.lines.forEach(originalLine => {
		if (isSemanticInstructionLine(originalLine)) {
			applySemanticLine(originalLine, context);
		} else if (isMemoryDeclarationLine(originalLine)) {
			const declarationLine = context.resolveMemoryDeclarationLine?.(originalLine) ?? originalLine;
			applyMemoryDeclarationLine(normalizeCompileTimeArguments(declarationLine, context), context);
		} else if (shouldValidateUnhandledLines) {
			normalizeCompileTimeArguments(originalLine, context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;
}

/**
 * Normalizes and visits one scalar memory declaration without allocating memory.
 *
 * @param originalLine - Scalar declaration line from the AST or a prototype shape.
 * @param context - Namespace context used for semantic argument resolution.
 * @param visitor - Callback applied to the normalized scalar declaration.
 * @returns Nothing.
 */
function visitScalarMemoryDeclarationLine(
	originalLine: ScalarMemoryDeclarationLine,
	context: NamespaceBuildContext,
	visitor: ScalarMemoryDeclarationVisitor
): void {
	const line = normalizeCompileTimeArguments(originalLine, context);
	visitor(line as ScalarMemoryDeclarationLine, context);
}

/**
 * Expands a shape line and visits only its scalar memory declarations.
 *
 * @param line - Normalized shape instruction line.
 * @param context - Namespace context used for prototype lookup and inherited metadata.
 * @param visitor - Callback applied to each normalized scalar declaration.
 * @returns Nothing.
 */
function visitShapeScalarMemoryDeclarationLines(
	line: ShapeLine,
	context: NamespaceBuildContext,
	visitor: ScalarMemoryDeclarationVisitor
): void {
	if (!context.expandPrototypeShapes) {
		return;
	}

	const prototypeId = line.arguments[0].value;
	if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
		context.namespace.prototypeShapeIds.push(prototypeId);
	}

	const prototype = context.prototypeShapes?.[prototypeId];
	if (!prototype) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
	}

	const previousInherited = context.isInherited;
	context.isInherited = true;
	try {
		for (const declarationLine of prototype.memoryDeclarationLines) {
			const inheritedDeclarationLine = {
				...declarationLine,
				lineNumber: line.lineNumber,
			};
			if (isScalarMemoryDeclarationLine(inheritedDeclarationLine)) {
				visitScalarMemoryDeclarationLine(inheritedDeclarationLine, context, visitor);
			}
		}
	} finally {
		context.isInherited = previousInherited;
	}
}

/**
 * Applies semantic instructions needed while visiting scalar declarations.
 *
 * Shape instructions are expanded through the scalar visitor so inherited scalar
 * defaults are resolved without allocating memory for arrays or other declarations.
 *
 * @param originalLine - Semantic instruction line from the AST.
 * @param context - Namespace context used for semantic state.
 * @param visitor - Callback applied to scalar declarations expanded from shapes.
 * @returns Nothing.
 */
function applySemanticLineForScalarMemoryTraversal(
	originalLine: SemanticInstructionLine,
	context: NamespaceBuildContext,
	visitor: ScalarMemoryDeclarationVisitor
): void {
	const line = normalizeCompileTimeArguments(originalLine, context);
	if (line.instruction === 'shape') {
		visitShapeScalarMemoryDeclarationLines(line, context, visitor);
		return;
	}

	applySemanticInstruction(line, context);
}

/**
 * Visits scalar declarations without allocating memory or validating non-scalar declarations.
 *
 * @param ast - Validated AST whose scalar declarations should be revisited.
 * @param context - Namespace context seeded with an existing memory map.
 * @param visitor - Callback applied to each normalized scalar declaration.
 * @returns Nothing.
 */
function visitNamespaceScalarMemoryDeclarationLines(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	context: NamespaceBuildContext,
	visitor: ScalarMemoryDeclarationVisitor
): void {
	const sourceBlockSpec = compilerSourceBlockInstructionByType[ast.type];
	const shouldValidateUnhandledLines = sourceBlockSpec.compilationMode === null;

	ast.lines.forEach(originalLine => {
		if (isSemanticInstructionLine(originalLine)) {
			applySemanticLineForScalarMemoryTraversal(originalLine, context, visitor);
		} else if (isScalarMemoryDeclarationLine(originalLine)) {
			visitScalarMemoryDeclarationLine(originalLine, context, visitor);
		} else if (!isMemoryDeclarationLine(originalLine) && shouldValidateUnhandledLines) {
			normalizeCompileTimeArguments(originalLine, context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;
}

/**
 * Resolves one scalar declaration's default value after namespace addresses are available.
 *
 * @param line - Scalar memory declaration line being revisited.
 * @param context - Compilation context with all collected namespaces available.
 * @returns Nothing.
 */
function resolveScalarMemoryAddressDefault(line: ScalarMemoryDeclarationLine, context: NamespaceBuildContext): void {
	const { id, defaultValue, defaultAddress } = parseMemoryInstructionArguments(line, context);
	const memoryItem = context.namespace.memory[id];
	if (!memoryItem || memoryItem.numberOfElements !== 1) {
		return;
	}

	memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	if (memoryItem.pointerDepth > 0) {
		applyPointerPointeeFields(memoryItem, defaultAddress, context);
	}
}

/**
 * Replays semantic declaration traversal over an existing memory map to resolve address defaults.
 *
 * This pass intentionally does not allocate memory. It updates scalar `default`
 * values and pointer pointee metadata now that intermodule addresses can be
 * resolved against the full namespace map.
 *
 * @param ast - Validated AST whose declarations should be revisited.
 * @param namespaces - Collected namespaces used for intermodule address resolution.
 * @param namespace - Existing namespace layout to update.
 * @param functions - Function registry available to semantic normalization.
 * @param options - Compiler options for this compilation pass.
 * @param prototypeShapes - Prototype shape ASTs available during semantic traversal.
 * @returns Namespace context after address defaults have been resolved.
 */
function resolveNamespaceAddressDefaults(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	namespaces: Namespaces,
	namespace: NonNullable<Namespaces[string]>,
	functions?: FunctionRegistry,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(
		ast,
		namespaces,
		namespace.byteAddress ?? 0,
		functions,
		options,
		prototypeShapes,
		{
			memory: namespace.memory ?? {},
			currentModuleNextWordOffset: namespace.wordAlignedSize ?? 0,
			currentModuleWordAlignedSize: namespace.wordAlignedSize ?? 0,
		}
	);
	visitNamespaceScalarMemoryDeclarationLines(ast, context, resolveScalarMemoryAddressDefault);

	return context;
}

/**
 * Assigns memory addresses for a namespace without resolving scalar address defaults.
 *
 * Scalar defaults may reference modules that have not yet received stable byte
 * addresses, so this pass strips those defaults before declaration handling.
 * Array defaults are still resolved during allocation because they affect data
 * size and must be known immediately.
 *
 * @param ast - Validated AST whose namespace layout should be allocated.
 * @param namespaces - Namespaces collected so far.
 * @param startingByteAddress - Absolute byte address where this namespace should begin.
 * @param functions - Function registry available to semantic normalization.
 * @param options - Compiler options for this compilation pass.
 * @param prototypeShapes - Prototype shape ASTs available during semantic traversal.
 * @returns Namespace context containing assigned memory addresses and sizes.
 */
function allocateNamespaceMemoryLayout(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
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
		{
			resolveMemoryDeclarationLine: stripScalarDefaultForAddressAllocation,
		}
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
	ast: ValidatedModuleAST | ValidatedConstantsAST,
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

	return resolveNamespaceAddressDefaults(
		ast,
		namespaces,
		{
			kind: ast.type,
			consts: context.namespace.consts,
			memory: context.namespace.memory,
			...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
			byteAddress: startingByteAddress,
			wordAlignedSize: context.currentModuleWordAlignedSize,
		},
		functions,
		options,
		prototypeShapes
	);
}

function getModuleRegionFromAst(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	options: Pick<CompileOptions, 'memoryRegions'>
): { memoryIndex: number; memoryRegionName?: string } {
	const regionLine = ast.type === moduleBlock.type ? ast.regionLine : undefined;

	if (!regionLine) {
		return getDefaultMemoryRegion();
	}

	const [argument] = regionLine.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, options.memoryRegions ?? [], regionLine);
	}

	return resolveMemoryRegionName(argument.value, options.memoryRegions ?? [], regionLine);
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

/**
 * Removes scalar declaration defaults while preserving the declared identifier.
 *
 * @param line - Memory declaration line being prepared for address allocation.
 * @returns The declaration line to use during address allocation.
 */
function stripScalarDefaultForAddressAllocation(line: MemoryDeclarationLine): MemoryDeclarationLine {
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
 * Assigns namespace memory addresses, then resolves scalar address defaults once all module addresses are known.
 *
 * @param asts - Validated ASTs being processed.
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param layoutAsts - Module AST order used for memory layout.
 * @param options - Compiler options for this compilation pass.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The computed result.
 */
export function collectNamespacesFromASTs(
	asts: readonly (ValidatedModuleAST | ValidatedConstantsAST)[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: FunctionRegistry,
	layoutAsts: readonly (ValidatedModuleAST | ValidatedConstantsAST)[] = asts,
	options: Pick<CompileOptions, 'memoryRegions'> = {},
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: Array<ValidatedModuleAST | ValidatedConstantsAST> = [];

		for (const ast of pendingAsts) {
			try {
				const context = allocateNamespaceMemoryLayout(
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
					consts: { ...context.namespace.consts },
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
		if (ast.type !== moduleBlock.type) {
			continue;
		}

		const region = getModuleRegionFromAst(ast, options);
		const nextStartingByteAddress = nextStartingByteAddressByMemoryIndex[region.memoryIndex] ?? startingByteAddress;
		const context = allocateNamespaceMemoryLayout(
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
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
			...getMemoryRegionFields(region.memoryIndex, region.memoryRegionName),
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: context.currentModuleWordAlignedSize,
		};

		nextStartingByteAddressByMemoryIndex[region.memoryIndex] =
			nextStartingByteAddress + context.currentModuleWordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	for (const ast of layoutAsts) {
		if (ast.type !== moduleBlock.type) {
			continue;
		}

		const namespace = namespaces[ast.id];
		if (!namespace || typeof namespace.byteAddress !== 'number') {
			continue;
		}

		const context = resolveNamespaceAddressDefaults(
			ast,
			namespaces,
			namespace,
			compiledFunctions,
			options,
			prototypeShapes
		);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			...namespace,
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
			wordAlignedSize: context.currentModuleWordAlignedSize,
		};
	}

	return namespaces;
}
