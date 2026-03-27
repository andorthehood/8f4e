import { isConstantName } from '@8f4e/ast-parser';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';

import { ErrorCode, getError } from '../compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import instructions, { type Instruction } from '../instructionCompilers';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { isInstructionIsInsideAModule, isInstructionIsInsideBlock } from '../utils/blockStack';
import {
	type AST,
	ArgumentType,
	BLOCK_TYPE,
	type CompilationContext,
	type CompiledFunctionLookup,
	type Namespace,
	type Namespaces,
} from '../types';

const namespacePrepassInstructions = new Set<string>([
	'int',
	'float',
	'int*',
	'int**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
	'float[]',
	'int[]',
	'int8[]',
	'int8u[]',
	'int16[]',
	'int16u[]',
	'int32[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'float64[]',
	'float64*[]',
	'float64**[]',
]);

function collectConstDeclaration(line: AST[number], context: CompilationContext) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER || !isConstantName(line.arguments[0].value)) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (line.arguments[1].type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	context.namespace.consts[line.arguments[0].value] = line.arguments[1];
}

function applyUseNamespace(line: AST[number], context: CompilationContext) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const namespaceToUse = context.namespace.namespaces[line.arguments[0].value];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: line.arguments[0].value });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}

function openModuleScope(
	line: AST[number],
	context: CompilationContext,
	blockType: BLOCK_TYPE.MODULE | BLOCK_TYPE.CONSTANTS
) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (blockType === BLOCK_TYPE.CONSTANTS && context.blockStack.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType,
	});

	context.namespace.moduleName = line.arguments[0].value;
	context.codeBlockId = line.arguments[0].value;
	context.codeBlockType = blockType === BLOCK_TYPE.CONSTANTS ? 'constants' : 'module';
}

function closeModuleScope(
	line: AST[number],
	context: CompilationContext,
	blockType: BLOCK_TYPE.MODULE | BLOCK_TYPE.CONSTANTS
) {
	const insideExpectedBlock =
		blockType === BLOCK_TYPE.MODULE
			? isInstructionIsInsideAModule(context.blockStack)
			: isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS);

	if (!insideExpectedBlock) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== blockType) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}

export function applySemanticLine(line: AST[number], context: CompilationContext) {
	if (line.instruction === 'const') {
		collectConstDeclaration(line, context);
		return;
	}

	if (line.instruction === 'use') {
		applyUseNamespace(line, context);
		return;
	}

	if (line.instruction === 'module') {
		openModuleScope(line, context, BLOCK_TYPE.MODULE);
		return;
	}

	if (line.instruction === 'constants') {
		openModuleScope(line, context, BLOCK_TYPE.CONSTANTS);
		return;
	}

	if (line.instruction === 'moduleEnd') {
		closeModuleScope(line, context, BLOCK_TYPE.MODULE);
		return;
	}

	if (line.instruction === 'constantsEnd') {
		closeModuleScope(line, context, BLOCK_TYPE.CONSTANTS);
	}
}

function applyNamespacePrepassLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	const instruction = line.instruction as Instruction;
	if (!instructions[instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}

	instructions[instruction](line, context);
}

export function prepassNamespace(
	ast: AST,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup
): CompilationContext {
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: {},
			locals: {},
			consts: { ...builtInConsts },
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
		if (!isSemanticOnly && !namespacePrepassInstructions.has(originalLine.instruction as Instruction)) {
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
	builtInConsts: Namespace['consts'] = {},
	compiledFunctions?: CompiledFunctionLookup
): Namespaces {
	const namespaces: Namespaces = {};
	let nextStartingByteAddress = startingByteAddress;

	for (const ast of asts) {
		const context = prepassNamespace(ast, builtInConsts, namespaces, nextStartingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}
		namespaces[context.namespace.moduleName] = {
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
		};
		nextStartingByteAddress += calculateWordAlignedSizeOfMemory(context.namespace.memory) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}
