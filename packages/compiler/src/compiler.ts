import { compileToAST } from '@8f4e/ast-parser';

import createFunction from './wasmUtils/codeSection/createFunction';
import createLocalDeclaration from './wasmUtils/codeSection/createLocalDeclaration';
import instructions, { Instruction } from './instructionCompilers';
import {
	AST,
	BLOCK_TYPE,
	CompilationContext,
	CompiledModule,
	CompiledFunction,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	Namespace,
	Namespaces,
} from './types';
import { ErrorCode, getError } from './compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import Type from './wasmUtils/type';
import { calculateWordAlignedSizeOfMemory } from './utils/compilation';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';
import { applySemanticLine, prepassNamespace } from './semantic/buildNamespace';

export type { MemoryTypes, MemoryMap } from './types';

export function compileCodegenLine(line: AST[number], context: CompilationContext) {
	const instruction = line.instruction as Instruction;

	if (!instructions[instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	instructions[instruction](line, context);
}

export function compileLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		applySemanticLine(line, context);
		return;
	}

	compileCodegenLine(line, context);
}

export function compileSegment(
	code: string[],
	context: CompilationContext,
	lineMetadata?: Array<{ callSiteLineNumber: number; macroId?: string }>
) {
	compileToAST(code, lineMetadata).forEach(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
	});
	return context;
}

export function compileModule(
	ast: AST,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	startingByteAddress = 0,
	index: number,
	functions?: CompiledFunctionLookup
): CompiledModule {
	const prepassContext = prepassNamespace(ast, builtInConsts, namespaces, startingByteAddress, functions);
	const moduleBlockType = ast[0]?.instruction === 'constants' ? BLOCK_TYPE.CONSTANTS : BLOCK_TYPE.MODULE;
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: {},
			locals: {},
			consts: { ...prepassContext.namespace.consts },
			moduleName: prepassContext.namespace.moduleName,
			functions,
		},
		byteCode: [],
		stack: [],
		blockStack: [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: moduleBlockType,
			},
		],
		startingByteAddress,
		mode: 'module',
		codeBlockId: prepassContext.namespace.moduleName,
		codeBlockType: moduleBlockType === BLOCK_TYPE.CONSTANTS ? 'constants' : 'module',
	};

	const normalizedAst = ast.map(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		if (!line.isSemanticOnly) {
			compileCodegenLine(line, context);
		}
		return line;
	});

	if (!context.namespace.moduleName) {
		throw getError(
			ErrorCode.MISSING_MODULE_ID,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	if (context.stack.length > 0) {
		throw getError(
			ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	return {
		id: context.namespace.moduleName,
		cycleFunction: createFunction(
			Object.values(context.namespace.locals).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, 1);
			}),
			context.byteCode
		),
		initFunctionBody: [],
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		wordAlignedSize: calculateWordAlignedSizeOfMemory(context.namespace.memory),
		ast: normalizedAst,
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
		initOnlyExecution: context.initOnlyExecution,
	};
}

export function compileFunction(
	ast: AST,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	wasmIndex: number,
	typeRegistry: FunctionTypeRegistry
): CompiledFunction {
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: {},
			locals: {},
			consts: { ...builtInConsts },
			moduleName: undefined,
			functions: {},
		},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		mode: 'function',
		codeBlockType: 'function',
		functionTypeRegistry: typeRegistry,
	};

	const normalizedAst = ast.map(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
		return line;
	});

	if (!context.currentFunctionId) {
		throw getError(
			ErrorCode.MISSING_FUNCTION_ID,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'function', arguments: [] },
			context
		);
	}

	if (!context.currentFunctionSignature) {
		throw getError(
			ErrorCode.INVALID_FUNCTION_SIGNATURE,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'function', arguments: [] },
			context
		);
	}

	// Collect locals (excluding parameters)
	// Parameters are always at indices 0, 1, 2, ..., (parameterCount - 1)
	// Regular locals declared with the 'local' instruction come after parameters
	const parameterCount = context.currentFunctionSignature.parameters.length;
	const localDeclarations = Object.entries(context.namespace.locals)
		.filter(([, local]) => local.index >= parameterCount)
		.map(([, local]) => ({
			isInteger: local.isInteger,
			isFloat64: local.isFloat64,
			count: 1,
		}));

	// Get the type index for this function's signature
	const params = context.currentFunctionSignature.parameters.map(type =>
		type === 'int' ? Type.I32 : type === 'float64' ? Type.F64 : Type.F32
	);
	const results = context.currentFunctionSignature.returns.map(type =>
		type === 'int' ? Type.I32 : type === 'float64' ? Type.F64 : Type.F32
	);
	const signature = JSON.stringify({ params, results });
	const typeIndex = typeRegistry.signatureMap.get(signature);

	return {
		id: context.currentFunctionId,
		signature: context.currentFunctionSignature,
		body: createFunction(
			localDeclarations.map(local =>
				createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, local.count)
			),
			context.byteCode
		),
		locals: localDeclarations,
		wasmIndex,
		typeIndex,
		ast: normalizedAst,
	};
}
