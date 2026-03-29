import {
	ArgumentType,
	extractIntermodularElementCountBase,
	extractIntermodularElementMaxBase,
	extractIntermodularElementMinBase,
	extractIntermodularElementWordSizeBase,
	extractIntermodularModuleReferenceBase,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularReference,
	isIntermodularModuleReference,
} from '@8f4e/tokenizer';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';
import { applyMemoryDeclarationLine, isMemoryDeclarationInstruction } from './declarations';
import applySemanticInstruction from './instructions';

import { ErrorCode, getError } from '../compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import {
	type AST,
	type CompilationContext,
	type CompiledFunctionLookup,
	type Namespaces,
	type Argument,
	type ParsedSemanticInstructionLine,
} from '../types';

export function applySemanticLine(line: AST[number], context: CompilationContext) {
	if (!isParsedSemanticInstructionLine(line)) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applySemanticInstruction(normalizeCompileTimeArguments(line, context), context);
}

function isParsedSemanticInstructionLine(line: AST[number]): line is ParsedSemanticInstructionLine {
	switch (line.instruction) {
		case 'const':
		case 'use':
		case 'init':
		case 'module':
		case 'moduleEnd':
		case 'constants':
		case 'constantsEnd':
			return true;
	}

	return false;
}
function applyNamespacePrepassLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	if (!isMemoryDeclarationInstruction(line.instruction)) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	applyMemoryDeclarationLine(line, context);
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
		const isSemanticOnly = !!originalLine.isSemanticOnly;
		if (!isSemanticOnly && !isMemoryDeclarationInstruction(originalLine.instruction)) {
			return;
		}

		const line = normalizeCompileTimeArguments(originalLine, context);
		applyNamespacePrepassLine(line, context);
	});

	return context;
}

function getReferencedNamespaceIdsFromValue(value: string): string[] {
	if (isIntermodularElementCountReference(value)) {
		return [extractIntermodularElementCountBase(value).module];
	}
	if (isIntermodularElementWordSizeReference(value)) {
		return [extractIntermodularElementWordSizeBase(value).module];
	}
	if (isIntermodularElementMaxReference(value)) {
		return [extractIntermodularElementMaxBase(value).module];
	}
	if (isIntermodularElementMinReference(value)) {
		return [extractIntermodularElementMinBase(value).module];
	}
	if (isIntermodularModuleReference(value)) {
		return [extractIntermodularModuleReferenceBase(value).module];
	}
	if (isIntermodularReference(value)) {
		const cleanRef = value.endsWith('&') ? value.slice(0, -1) : value.slice(1);
		return [cleanRef.split(':')[0]];
	}

	return [];
}

function getReferencedNamespaceIdsFromArgument(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [argument.lhs, argument.rhs].flatMap(value =>
			typeof value === 'string' ? getReferencedNamespaceIdsFromValue(value) : []
		);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	return getReferencedNamespaceIdsFromValue(argument.value);
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
			isMemoryDeclarationInstruction(line.instruction) &&
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
