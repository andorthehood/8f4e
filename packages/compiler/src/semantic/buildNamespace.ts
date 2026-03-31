import { ArgumentType } from '@8f4e/tokenizer';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';
import { applyMemoryDeclarationLine } from './declarations';
import applySemanticInstruction from './instructions';

import { ErrorCode, getError } from '../compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import {
	type AST,
	type CompilationContext,
	type CompiledFunctionLookup,
	type FunctionSignature,
	type Namespaces,
	type Argument,
	type ParsedSemanticInstructionLine,
} from '../types';

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic normalization (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 */
export function collectFunctionMetadataFromAsts(asts: AST[], startingWasmIndex: number): CompiledFunctionLookup {
	const result: CompiledFunctionLookup = {};

	for (const [index, ast] of asts.entries()) {
		const functionLine = ast.find(line => line.instruction === 'function');
		if (!functionLine || functionLine.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
			continue;
		}

		const id = functionLine.arguments[0].value;
		const signature: FunctionSignature = {
			parameters: ast.flatMap(line => {
				if (line.instruction !== 'param' || line.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
					return [];
				}

				return [line.arguments[0].value as FunctionSignature['parameters'][number]];
			}),
			returns: [],
		};

		const functionEndLine = ast.find(line => line.instruction === 'functionEnd');
		if (functionEndLine) {
			signature.returns = functionEndLine.arguments.map(
				arg => (arg as { type: ArgumentType.IDENTIFIER; value: FunctionSignature['returns'][number] }).value
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

export function applySemanticLine(line: AST[number], context: CompilationContext) {
	if (!line.isSemanticOnly) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applySemanticInstruction(normalizeCompileTimeArguments(line as ParsedSemanticInstructionLine, context), context);
}
function applyNamespacePrepassLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	if (!line.isMemoryDeclaration) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applyMemoryDeclarationLine(normalizeCompileTimeArguments(line, context), context);
}

export function prepassNamespace(
	ast: AST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup
): CompilationContext {
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
		startingByteAddress,
		mode: 'module',
		codeBlockType: ast[0]?.instruction === 'constants' ? 'constants' : 'module',
	};

	ast.forEach(originalLine => {
		if (!originalLine.isSemanticOnly && !originalLine.isMemoryDeclaration) {
			return;
		}

		applyNamespacePrepassLine(originalLine, context);
	});

	return context;
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
		if (line.instruction === 'init') {
			return [];
		}

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
	layoutAsts: AST[] = asts
): Namespaces {
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
					compiledFunctions
				);
				if (!context.namespace.moduleName) {
					continue;
				}
				namespaces[context.namespace.moduleName] = {
					consts: { ...context.namespace.consts },
					memory: context.namespace.memory,
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
		prepassNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions);
	}

	let nextStartingByteAddress = startingByteAddress;
	for (const ast of layoutAsts) {
		const context = prepassNamespace(ast, namespaces, nextStartingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: calculateWordAlignedSizeOfMemory(context.namespace.memory),
		};

		nextStartingByteAddress += calculateWordAlignedSizeOfMemory(context.namespace.memory) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}
