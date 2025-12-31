import { instructionParser, isComment, isValidInstruction } from './syntax/instructionParser';
import { parseArgument } from './syntax/parseArgument';
import { createFunction, createLocalDeclaration } from './wasmUtils/sectionHelpers';
import instructions, { Instruction } from './instructionCompilers';
import {
	AST,
	CompilationContext,
	CompileOptions,
	CompiledModule,
	CompiledFunction,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	Namespace,
	Namespaces,
} from './types';
import { ErrorCode, getError } from './errors';
import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import Type from './wasmUtils/type';
import { calculateWordAlignedSizeOfMemory } from './utils/compilation';

export type { MemoryTypes, MemoryMap } from './types';

// Re-export for backward compatibility
export { instructionParser, isComment, isValidInstruction, parseArgument };

export function parseLine(line: string, lineNumber: number): AST[number] {
	const [, instruction, ...args] = (line.match(instructionParser) || []) as [never, Instruction, string, string];

	return {
		lineNumber,
		instruction,
		arguments: args
			.filter(argument => {
				return argument !== '';
			})
			.map(parseArgument),
	};
}

export function compileToAST(code: string[], options?: CompileOptions) {
	return code
		.map((line, index) => [index, line] as [number, string])
		.filter(([, line]) => !isComment(line))
		.filter(([, line]) => isValidInstruction(line))
		.filter(([lineNumber, line]) => {
			if (!options) {
				return true;
			}
			const { instruction } = parseLine(line, lineNumber);
			return !options.environmentExtensions.ignoredKeywords.includes(instruction);
		})
		.map(([lineNumber, line]) => {
			return parseLine(line, lineNumber);
		});
}

export function compileLine(line: AST[number], context: CompilationContext) {
	if (!instructions[line.instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	instructions[line.instruction](line, context);
}

export function compileSegment(lines: string[], context: CompilationContext) {
	compileToAST(lines).forEach(line => {
		compileLine(line, context);
	});
	return context;
}

export function compileModule(
	ast: AST,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	startingByteAddress = 0,
	memorySizeBytes: number,
	index: number,
	functions?: CompiledFunctionLookup
): CompiledModule {
	const context: CompilationContext = {
		namespace: {
			namespaces,
			memory: {},
			locals: {},
			consts: { ...builtInConsts },
			moduleName: undefined,
			functions,
		},
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress,
		memoryByteSize: memorySizeBytes,
		mode: 'module',
	};

	ast.forEach(line => {
		compileLine(line, context);
	});

	if (!context.namespace.moduleName) {
		throw getError(ErrorCode.MISSING_MODULE_ID, { lineNumber: 0, instruction: 'module', arguments: [] }, context);
	}

	if (context.stack.length > 0) {
		throw getError(
			ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS,
			{ lineNumber: 0, instruction: 'module', arguments: [] },
			context
		);
	}

	return {
		id: context.namespace.moduleName,
		loopFunction: createFunction(
			Object.values(context.namespace.locals).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : Type.F32, 1);
			}),
			context.loopSegmentByteCode
		),
		initFunctionBody: context.initSegmentByteCode,
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		wordAlignedSize: calculateWordAlignedSizeOfMemory(context.namespace.memory),
		ast,
		index,
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
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		memoryByteSize: 0,
		mode: 'function',
		functionTypeRegistry: typeRegistry,
	};

	ast.forEach(line => {
		compileLine(line, context);
	});

	if (!context.currentFunctionId) {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, { lineNumber: 0, instruction: 'function', arguments: [] }, context);
	}

	if (!context.currentFunctionSignature) {
		throw getError(
			ErrorCode.INVALID_FUNCTION_SIGNATURE,
			{ lineNumber: 0, instruction: 'function', arguments: [] },
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
			count: 1,
		}));

	// Get the type index for this function's signature
	const params = context.currentFunctionSignature.parameters.map(type => (type === 'int' ? Type.I32 : Type.F32));
	const results = context.currentFunctionSignature.returns.map(type => (type === 'int' ? Type.I32 : Type.F32));
	const signature = JSON.stringify({ params, results });
	const typeIndex = typeRegistry.signatureMap.get(signature);

	return {
		id: context.currentFunctionId,
		signature: context.currentFunctionSignature,
		body: createFunction(
			localDeclarations.map(local => createLocalDeclaration(local.isInteger ? Type.I32 : Type.F32, local.count)),
			context.loopSegmentByteCode
		),
		locals: localDeclarations,
		wasmIndex,
		typeIndex,
		ast,
	};
}
