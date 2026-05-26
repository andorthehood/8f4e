import {
	ArgumentType,
	GLOBAL_ALIGNMENT_BOUNDARY,
	compilerSourceBlockInstructionByType,
	isNamedScalarMemoryDeclarationLine,
	isUseLine,
	type Argument,
	type ModuleCompilationAST,
	type CompileOptions,
	type CompilationContext,
	type CompilerASTLine,
	type FunctionMetadataLookup,
	type FunctionAST,
	type Namespaces,
	type NamespacePrepassContext,
	type ParsedSemanticInstructionLine,
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

export function assertUniqueModuleIds(asts: readonly ModuleCompilationAST[]): void {
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

export function applySemanticLine(line: CompilerASTLine, context: CompilationContext) {
	if (!line.isSemanticOnly) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applySemanticInstruction(normalizeCompileTimeArguments(line as ParsedSemanticInstructionLine, context), context);
}

export function prepassNamespace(
	ast: ModuleCompilationAST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: FunctionMetadataLookup,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): NamespacePrepassContext {
	const defaultRegion = getDefaultMemoryRegion();
	const context = createCompilationContext<NamespacePrepassContext>({
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

	ast.lines.forEach(originalLine => {
		if (originalLine.isSemanticOnly) {
			applySemanticLine(originalLine, context);
		} else if (originalLine.isMemoryDeclaration) {
			applyMemoryDeclarationLine(normalizeCompileTimeArguments(originalLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset;

	ast.lines.forEach(originalLine => {
		if (!originalLine.isMemoryDeclaration || originalLine.instruction.endsWith('[]')) {
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

	return context;
}

function getModuleRegionFromAst(
	ast: ModuleCompilationAST,
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

function getReferencedNamespaceIdsFromArgument(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [...argument.intermoduleIds];
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	if (argument.scope !== 'intermodule' || !argument.targetModuleId) {
		return [];
	}
	return [argument.targetModuleId];
}

function getDeferredNamespaceIds(line: CompilerASTLine): string[] {
	if (isUseLine(line)) {
		return [line.arguments[0].value];
	}

	return line.arguments.flatMap(argument => getReferencedNamespaceIdsFromArgument(argument));
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

	const referencedNamespaceIds = getDeferredNamespaceIds(line);
	return referencedNamespaceIds.some(namespaceId => !namespaces[namespaceId]);
}

function toNamespaceDiscoveryAst<TAst extends ModuleCompilationAST>(ast: TAst): TAst {
	const lines = ast.lines.flatMap(line => {
		if (isNamedScalarMemoryDeclarationLine(line)) {
			return [
				{
					...line,
					arguments: [line.arguments[0]],
				},
			];
		}

		return [line];
	}) as TAst['lines'];

	return {
		...ast,
		lines,
	};
}

export function collectNamespacesFromASTs(
	asts: readonly ModuleCompilationAST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: FunctionMetadataLookup,
	layoutAsts: readonly ModuleCompilationAST[] = asts,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: ModuleCompilationAST[] = [];

		for (const ast of pendingAsts) {
			try {
				const context = prepassNamespace(
					toNamespaceDiscoveryAst(ast),
					namespaces,
					startingByteAddress,
					compiledFunctions,
					options
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
		prepassNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions, options);
	}

	const nextStartingByteAddressByMemoryIndex: Record<number, number> = {
		[DEFAULT_MEMORY_INDEX]: startingByteAddress,
	};
	for (const ast of layoutAsts) {
		const region = getModuleRegionFromAst(ast, options);
		const nextStartingByteAddress = nextStartingByteAddressByMemoryIndex[region.memoryIndex] ?? startingByteAddress;
		const context = prepassNamespace(ast, namespaces, nextStartingByteAddress, compiledFunctions, options);
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
