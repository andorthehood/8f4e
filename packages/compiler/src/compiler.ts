import { ArgumentType, compileToAST } from '@8f4e/tokenizer';
import { createFunction, createLocalDeclaration, f32store, f64store, i32store, Type } from '@8f4e/compiler-wasm-utils';
import { type ModuleLayout, type PublicMemoryPlan } from '@8f4e/compiler-memory-layout';
import { BLOCK_TYPE, type Namespaces, type SymbolPassResult } from '@8f4e/compiler-symbols';

import instructions, { Instruction } from './instructionCompilers';
import {
	AST,
	CompilationContext,
	CompiledModule,
	CompiledFunction,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
} from './types';
import { ErrorCode, getError } from './compilerError';
import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import normalizeCompileTimeArguments from './semantic/normalizeCompileTimeArguments';

function getNamespaceId(ast: AST): string | undefined {
	const firstLine = ast[0];
	if (
		(firstLine?.instruction === 'module' || firstLine?.instruction === 'constants') &&
		firstLine.arguments[0]?.type === ArgumentType.IDENTIFIER
	) {
		return firstLine.arguments[0].value;
	}

	return undefined;
}

export function compileCodegenLine(line: AST[number], context: CompilationContext) {
	const instruction = line.instruction as Instruction;
	instructions[instruction](line, context);
}

export function compileLine(line: AST[number], context: CompilationContext) {
	if (line.isSemanticOnly) {
		if (
			line.instruction === 'const' ||
			line.instruction === 'use' ||
			line.instruction === 'module' ||
			line.instruction === 'moduleEnd' ||
			line.instruction === 'constants' ||
			line.instruction === 'constantsEnd' ||
			line.instruction === 'init'
		) {
			return;
		}
		compileCodegenLine(line, context);
		return;
	}

	if (line.isMemoryDeclaration && context.mode === 'function') {
		throw getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, line, context);
	}

	if (line.isMemoryDeclaration) {
		return;
	}

	compileCodegenLine(line, context);
}

export function compileSegment(
	code: string[],
	context: CompilationContext,
	lineMetadata?: Array<{ callSiteLineNumber: number; macroId?: string }>
) {
	const rawAst = compileToAST(code, lineMetadata);
	rawAst.forEach(originalLine => {
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
	});
	return context;
}

export function compileModule(
	ast: AST,
	namespaces: Namespaces,
	modules: Record<string, ModuleLayout>,
	startingByteAddress = 0,
	index: number,
	publicMemoryPlan: PublicMemoryPlan,
	functions?: CompiledFunctionLookup,
	internalAllocator = { nextByteAddress: 0 },
	symbolPassResult?: SymbolPassResult
): CompiledModule {
	const resolvedPublicMemoryPlan = publicMemoryPlan;
	const namespaceId = resolvedPublicMemoryPlan.moduleName ?? getNamespaceId(ast);
	const seededNamespace = namespaceId ? namespaces[namespaceId] : undefined;
	const constScopesForAst = symbolPassResult?.constScopesByAst.get(ast);
	const moduleLineIndex = ast.findIndex(line => line.instruction === 'module');
	const moduleEndLineIndex = ast.findIndex(line => line.instruction === 'moduleEnd');
	const context: CompilationContext = {
		namespace: {
			namespaces,
			modules,
			memory: resolvedPublicMemoryPlan.memory,
			consts: { ...(seededNamespace?.consts ?? {}) },
			moduleName: namespaceId,
			functions,
		},
		locals: {},
		internalResources: {},
		internalAllocator,
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: resolvedPublicMemoryPlan.currentModuleNextWordOffset,
		currentModuleWordAlignedSize: resolvedPublicMemoryPlan.currentModuleWordAlignedSize,
		mode: 'module',
		codeBlockId: undefined,
		codeBlockType: undefined,
	};

	const normalizedAst = resolvedPublicMemoryPlan.normalizedAst.map((originalLine, index) => {
		if (moduleLineIndex >= 0 && index > moduleLineIndex && (moduleEndLineIndex < 0 || index <= moduleEndLineIndex)) {
			if (!context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE)) {
				context.blockStack.unshift({
					hasExpectedResult: false,
					expectedResultIsInteger: false,
					blockType: BLOCK_TYPE.MODULE,
				});
			}
			context.codeBlockId = namespaceId;
			context.codeBlockType = 'module';
		}

		const visibleConsts = constScopesForAst?.[index];
		if (visibleConsts) {
			context.namespace.consts = { ...visibleConsts };
		}

		const line = originalLine;
		compileLine(line, context);
		return line;
	});

	if (context.stack.length > 0) {
		throw getError(
			ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS,
			{ lineNumberBeforeMacroExpansion: 0, lineNumberAfterMacroExpansion: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	const internalResourceInitBody = Object.values(context.internalResources).flatMap(resource => {
		if (resource.default === 0) {
			return [];
		}

		if (resource.storageType === 'float64') {
			return f64store(resource.byteAddress, resource.default);
		}

		return resource.storageType === 'int'
			? i32store(resource.byteAddress, resource.default)
			: f32store(resource.byteAddress, resource.default);
	});

	return {
		id: context.namespace.moduleName as string,
		cycleFunction: createFunction(
			Object.values(context.locals).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : local.isFloat64 ? Type.F64 : Type.F32, 1);
			}),
			context.byteCode
		),
		initFunctionBody: internalResourceInitBody,
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		wordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
		ast: normalizedAst,
		index,
		skipExecutionInCycle: context.skipExecutionInCycle,
		initOnlyExecution: context.initOnlyExecution,
	};
}

export function compileFunction(
	ast: AST,
	namespaces: Namespaces,
	modules: Record<string, ModuleLayout>,
	wasmIndex: number,
	typeRegistry: FunctionTypeRegistry,
	functions?: CompiledFunctionLookup,
	symbolPassResult?: SymbolPassResult
): CompiledFunction {
	const constScopesForAst = symbolPassResult?.constScopesByAst.get(ast);
	const symbolNormalizedAst = symbolPassResult?.normalizedAstsByAst.get(ast) ?? ast;
	const context: CompilationContext = {
		namespace: {
			namespaces,
			modules,
			memory: {},
			consts: {},
			moduleName: undefined,
			functions: functions ?? {},
		},
		locals: {},
		internalResources: {},
		internalAllocator: {
			nextByteAddress: 0,
		},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		mode: 'function',
		codeBlockType: 'function',
		functionTypeRegistry: typeRegistry,
	};

	const normalizedAst = symbolNormalizedAst.map((originalLine, index) => {
		const visibleConsts = constScopesForAst?.[index];
		if (visibleConsts) {
			context.namespace.consts = { ...visibleConsts };
		}
		const line = normalizeCompileTimeArguments(originalLine, context);
		compileLine(line, context);
		return line;
	});
	const currentFunctionSignature = context.currentFunctionSignature as CompiledFunction['signature'];
	const currentFunctionId = context.currentFunctionId as string;

	// Collect locals (excluding parameters)
	// Parameters are always at indices 0, 1, 2, ..., (parameterCount - 1)
	// Regular locals declared with the 'local' instruction come after parameters
	const parameterCount = currentFunctionSignature.parameters.length;
	const localDeclarations = Object.entries(context.locals)
		.filter(([, local]) => local.index >= parameterCount)
		.map(([, local]) => ({
			isInteger: local.isInteger,
			isFloat64: local.isFloat64,
			count: 1,
		}));

	// Get the type index for this function's signature
	const params = currentFunctionSignature.parameters.map(type =>
		type === 'int' ? Type.I32 : type === 'float64' ? Type.F64 : Type.F32
	);
	const results = currentFunctionSignature.returns.map(type =>
		type === 'int' ? Type.I32 : type === 'float64' ? Type.F64 : Type.F32
	);
	const signature = JSON.stringify({ params, results });
	const typeIndex = typeRegistry.signatureMap.get(signature);

	return {
		id: currentFunctionId,
		signature: currentFunctionSignature,
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
