import {
	ArgumentType,
	GLOBAL_ALIGNMENT_BOUNDARY,
	compilerSourceBlockInstructionByType,
	type AST,
	type Argument,
	type CompileOptions,
	type CompilationContext,
	type CompiledFunctionLookup,
	type FunctionSignature,
	type Namespaces,
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

import { getError } from '../compilerError';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';

const constantsBlock = compilerSourceBlockInstructionByType.constants;
const functionBlock = compilerSourceBlockInstructionByType.function;
const moduleBlock = compilerSourceBlockInstructionByType.module;

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic normalization (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 */
export function collectFunctionMetadataFromAsts(asts: AST[], startingWasmIndex: number): CompiledFunctionLookup {
	const result: CompiledFunctionLookup = {};

	for (const [index, ast] of asts.entries()) {
		const functionLine = ast.find(line => line.instruction === functionBlock.start);
		if (!functionLine || functionLine.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
			continue;
		}

		const id = functionLine.arguments[0].value;
		if (result[id]) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, functionLine, undefined, { identifier: id });
		}
		const signature: FunctionSignature = {
			parameters: ast.flatMap(line => {
				if (line.instruction !== 'param' || line.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
					return [];
				}

				return [line.arguments[0].value as FunctionSignature['parameters'][number]];
			}),
			returns: [],
		};

		const functionEndLine = ast.find(line => line.instruction === functionBlock.end);
		if (functionEndLine) {
			signature.returns = functionEndLine.arguments.map(
				arg => (arg as { type: typeof ArgumentType.IDENTIFIER; value: FunctionSignature['returns'][number] }).value
			);
		}

		result[id] = {
			id,
			signature,
			body: [],
			locals: [],
			wasmIndex: startingWasmIndex + index,
		};
	}

	return result;
}

export function assertUniqueModuleIds(asts: AST[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		const moduleLine = ast.find(line => line.instruction === moduleBlock.start);
		if (!moduleLine || moduleLine.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
			continue;
		}

		const id = moduleLine.arguments[0].value;
		if (seenModuleIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, moduleLine, undefined, { identifier: id });
		}
		seenModuleIds.add(id);
	}
}

export function applySemanticLine(line: AST[number], context: CompilationContext) {
	if (!line.isSemanticOnly) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applySemanticInstruction(normalizeCompileTimeArguments(line as ParsedSemanticInstructionLine, context), context);
}

export function prepassNamespace(
	ast: AST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): CompilationContext {
	const defaultRegion = getDefaultMemoryRegion();
	const context: CompilationContext = {
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
		insideModuleBlock: false,
		insideFunctionBlock: false,
		insideGenericBlock: false,
		insideLoopBlock: false,
		insideConditionBlock: false,
		insideConstantsBlock: false,
		insideMapBlock: false,
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: undefined,
		currentMemoryIndex: defaultRegion.memoryIndex,
		memoryRegions: options.memoryRegions ?? [],
		mode: moduleBlock.type,
		codeBlockType: ast[0]?.instruction === constantsBlock.start ? constantsBlock.type : moduleBlock.type,
	};

	ast.forEach(originalLine => {
		if (originalLine.isSemanticOnly) {
			applySemanticLine(originalLine, context);
		} else if (originalLine.isMemoryDeclaration) {
			applyMemoryDeclarationLine(normalizeCompileTimeArguments(originalLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset ?? 0;

	ast.forEach(originalLine => {
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

export function getModuleIdFromAst(ast: AST): string | undefined {
	const moduleLine = ast.find(line => line.instruction === moduleBlock.start);
	const moduleId = moduleLine?.arguments[0];
	return moduleId?.type === ArgumentType.IDENTIFIER ? moduleId.value : undefined;
}

function getModuleRegionFromAst(
	ast: AST,
	options: Pick<CompileOptions, 'memoryRegions'>
): { memoryIndex: number; memoryRegionName?: string } {
	const regionLine = ast.find(line => line.instruction === '#region');
	const argument = regionLine?.arguments[0];

	if (!regionLine || !argument) {
		return getDefaultMemoryRegion();
	}

	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, options.memoryRegions ?? [], regionLine);
	}

	if (argument.type === ArgumentType.IDENTIFIER) {
		return resolveMemoryRegionName(argument.value, options.memoryRegions ?? [], regionLine);
	}

	throw new Error('Invalid #region directive argument after syntax validation');
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

function getDeferredNamespaceIds(line: AST[number]): string[] {
	if (line.instruction === 'use' && line.arguments[0]?.type === ArgumentType.IDENTIFIER) {
		return [line.arguments[0].value];
	}

	return line.arguments.flatMap(argument => getReferencedNamespaceIdsFromArgument(argument));
}

function shouldDeferNamespaceCollection(
	error: unknown,
	line: AST[number] | undefined,
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

function toNamespaceDiscoveryAst(ast: AST): AST {
	return ast.flatMap(line => {
		if (
			line.isMemoryDeclaration &&
			!line.instruction.endsWith('[]') &&
			line.arguments[0]?.type === ArgumentType.IDENTIFIER
		) {
			return [
				{
					...line,
					arguments: [line.arguments[0]],
				},
			];
		}

		return [line];
	});
}

export function collectNamespacesFromASTs(
	asts: AST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: CompiledFunctionLookup,
	layoutAsts: AST[] = asts,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): Namespaces {
	validateMemoryRegionOptions(options, asts[0]?.[0]);
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: AST[] = [];

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
				const moduleLine = ast.find(line => line.instruction === moduleBlock.start);
				const existingNamespace = namespaces[context.namespace.moduleName];
				if (moduleLine && existingNamespace?.kind === moduleBlock.type) {
					throw getError(ErrorCode.DUPLICATE_IDENTIFIER, moduleLine ?? ast[0], context, {
						identifier: context.namespace.moduleName,
					});
				}
				namespaces[context.namespace.moduleName] = {
					kind: moduleLine ? moduleBlock.type : constantsBlock.type,
					consts: { ...context.namespace.consts },
					memory: context.namespace.memory,
					...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
				};
				madeProgress = true;
			} catch (error) {
				const failingLine =
					typeof error === 'object' && error !== null && 'line' in error ? (error.line as AST[number]) : undefined;
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
			wordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
		};

		nextStartingByteAddressByMemoryIndex[region.memoryIndex] =
			nextStartingByteAddress + (context.currentModuleWordAlignedSize ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}
