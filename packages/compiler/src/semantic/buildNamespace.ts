import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';
import { applyMemoryDeclarationLine, isMemoryDeclarationInstruction } from './declarations';
import applySemanticInstruction from './instructions';

import { ErrorCode, getError } from '../compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { type AST, type CompilationContext, type CompiledFunctionLookup, type Namespaces } from '../types';

export function applySemanticLine(line: AST[number], context: CompilationContext) {
	applySemanticInstruction(line, context);
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
			locals: {},
			consts: {},
			moduleName: undefined,
			functions,
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

export function collectNamespacesFromASTs(
	asts: AST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: CompiledFunctionLookup,
	layoutAsts: AST[] = asts
): Namespaces {
	const namespaces: Namespaces = {};

	for (const ast of asts) {
		const context = prepassNamespace(ast, namespaces, startingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}
		namespaces[context.namespace.moduleName] = {
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
		};
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
