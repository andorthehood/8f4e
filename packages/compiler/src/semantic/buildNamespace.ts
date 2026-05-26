import {
	ArgumentType,
	GLOBAL_ALIGNMENT_BOUNDARY,
	compilerSourceBlockInstructionByType,
	hasReferencedNamespaceIds,
	isNamedScalarMemoryDeclarationLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	type ConstantsAST,
	type CompileOptions,
	type CompilationContext,
	type CompilerASTLine,
	type FunctionMetadataLookup,
	type FunctionAST,
	type MemoryDeclarationLine,
	type ModuleAST,
	type Namespaces,
	type NamespaceBuildContext,
	type SemanticInstructionLine,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';
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
import { createCompilationContext } from './createCompilationContext';

import { getError } from '../compilerError';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';

const moduleBlock = compilerSourceBlockInstructionByType.module;

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic normalization (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 */
export function collectFunctionMetadataFromAsts(
	asts: readonly FunctionAST[],
	startingWasmIndex: number
): FunctionMetadataLookup {
	const result: FunctionMetadataLookup = {};

	for (const [index, ast] of asts.entries()) {
		const id = ast.id;
		if (result[id]) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.functionLine, undefined, { identifier: id });
		}

		result[id] = {
			id,
			signature: ast.signature,
			wasmIndex: startingWasmIndex + index,
		};
	}

	return result;
}

export function assertUniqueModuleIds(asts: readonly (ModuleAST | ConstantsAST)[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		if (ast.type !== moduleBlock.type) {
			continue;
		}

		const id = ast.id;
		if (seenModuleIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.moduleLine, undefined, { identifier: id });
		}
		seenModuleIds.add(id);
	}
}

export function applySemanticLine(line: SemanticInstructionLine, context: CompilationContext) {
	applySemanticInstruction(normalizeCompileTimeArguments(line, context), context);
}

function createNamespaceBuildContext(
	ast: ModuleAST | ConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionMetadataLookup,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): NamespaceBuildContext {
	const defaultRegion = getDefaultMemoryRegion();
	return createCompilationContext<NamespaceBuildContext>({
		namespace: {
			namespaces,
			memory: {},
			consts: {},
			moduleName: undefined,
			functions,
		},
		locals: {},
		internalResources: {},
		internalAllocator: {
			nextByteAddress: startingByteAddress,
		},
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
	});
}

function applyNamespaceDeclarationLines(
	ast: ModuleAST | ConstantsAST,
	context: NamespaceBuildContext,
	resolveDeclarationLine: (line: MemoryDeclarationLine) => MemoryDeclarationLine
): void {
	ast.lines.forEach(originalLine => {
		if (isSemanticInstructionLine(originalLine)) {
			applySemanticLine(originalLine, context);
		} else if (isMemoryDeclarationLine(originalLine)) {
			const declarationLine = resolveDeclarationLine(originalLine);
			applyMemoryDeclarationLine(normalizeCompileTimeArguments(declarationLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;
}

function resolveScalarMemoryDefaults(ast: ModuleAST | ConstantsAST, context: NamespaceBuildContext): void {
	ast.lines.forEach(originalLine => {
		if (!isMemoryDeclarationLine(originalLine) || originalLine.instruction.endsWith('[]')) {
			return;
		}

		const line = normalizeCompileTimeArguments(originalLine, context);
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			return;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	});
}

function discoverNamespace(
	ast: ModuleAST | ConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionMetadataLookup,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(ast, namespaces, startingByteAddress, functions, options);
	applyNamespaceDeclarationLines(ast, context, toNamespaceDiscoveryMemoryDeclarationLine);

	return context;
}

export function layoutNamespace(
	ast: ModuleAST | ConstantsAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionMetadataLookup,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): NamespaceBuildContext {
	const context = createNamespaceBuildContext(ast, namespaces, startingByteAddress, functions, options);
	applyNamespaceDeclarationLines(ast, context, line => line);
	resolveScalarMemoryDefaults(ast, context);

	return context;
}

function getModuleRegionFromAst(
	ast: ModuleAST | ConstantsAST,
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

export function collectNamespacesFromASTs(
	asts: readonly (ModuleAST | ConstantsAST)[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: FunctionMetadataLookup,
	layoutAsts: readonly (ModuleAST | ConstantsAST)[] = asts,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: Array<ModuleAST | ConstantsAST> = [];

		for (const ast of pendingAsts) {
			try {
				const context = discoverNamespace(ast, namespaces, startingByteAddress, compiledFunctions, options);
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
		layoutNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions, options);
	}

	const nextStartingByteAddressByMemoryIndex: Record<number, number> = {
		[DEFAULT_MEMORY_INDEX]: startingByteAddress,
	};
	for (const ast of layoutAsts) {
		const region = getModuleRegionFromAst(ast, options);
		const nextStartingByteAddress = nextStartingByteAddressByMemoryIndex[region.memoryIndex] ?? startingByteAddress;
		const context = layoutNamespace(ast, namespaces, nextStartingByteAddress, compiledFunctions, options);
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

	return namespaces;
}
