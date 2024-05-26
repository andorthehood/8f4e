import { createFunctionBody, createLocalDeclaration } from './wasmUtils/sectionHelpers';
import instructions, { Instruction } from './instructionCompilers';
import {
	AST,
	Argument,
	ArgumentType,
	CompilationContext,
	CompileOptions,
	CompiledModule,
	Namespace,
	Namespaces,
} from './types';
import { ErrorCode, getError } from './errors';
import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import Type from './wasmUtils/type';
import { calculateWordAlignedSizeOfMemory } from './utils';
import { WASM_MEMORY_PAGE_SIZE } from './wasmUtils/consts';

export { MemoryTypes, MemoryMap } from './types';

export const instructionParser =
	/^\s*([^\s;]+)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*(?:;.*|\s*)/;

export function parseArgument(argument: string): Argument {
	switch (true) {
		case /^-?[0-9.]+$/.test(argument):
			return { value: parseFloat(argument), type: ArgumentType.LITERAL, isInteger: /^-?[0-9]+$/.test(argument) };
		case /^-?0x[0-9a-fA-F]+$/.test(argument):
			return { value: parseInt(argument.replace('0x', ''), 16), type: ArgumentType.LITERAL, isInteger: true };
		case /^-?0b[0-1]+$/.test(argument):
			return { value: parseInt(argument.replace('0b', ''), 2), type: ArgumentType.LITERAL, isInteger: true };
		default:
			return { value: argument, type: ArgumentType.IDENTIFIER };
	}
}

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

export function isComment(line: string): boolean {
	return /^\s*;/.test(line);
}

export function isValidInstruction(line: string): boolean {
	return instructionParser.test(line);
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

export function compileLine(
	line: AST[number],
	context: CompilationContext
): { byteCode: number[]; context: CompilationContext } {
	if (!instructions[line.instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	return instructions[line.instruction](line, context);
}

export function compileSegment(
	lines: AST,
	context: CompilationContext
): { byteCode: number[]; context: CompilationContext } {
	const byteCode = lines.reduce((acc, line) => {
		const { byteCode, context: newContext } = compileLine(line, context);
		context = newContext;
		return [...acc, ...byteCode];
	}, [] as number[]);

	return {
		byteCode,
		context,
	};
}

export function parseSegment(
	lines: string[],
	context: CompilationContext
): {
	byteCode: number[];
	context: CompilationContext;
} {
	return compileSegment(compileToAST(lines), context);
}

export function compileModule(
	ast: AST,
	builtInConsts: Namespace['consts'],
	namespaces: Namespaces,
	startingByteAddress = 0,
	maxMemorySize: number,
	index: number
): CompiledModule {
	const { byteCode, context } = compileSegment(ast, {
		namespace: {
			namespaces,
			memory: new Map(),
			locals: new Map(),
			consts: { ...builtInConsts },
			moduleName: undefined,
		},
		stack: [],
		blockStack: [],
		startingByteAddress,
		memoryByteSize: maxMemorySize * WASM_MEMORY_PAGE_SIZE,
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
		functionBody: createFunctionBody(
			Array.from(context.namespace.locals.values()).map(local => {
				return createLocalDeclaration(local.isInteger ? Type.I32 : Type.F32, 1);
			}),
			byteCode
		),
		byteAddress: startingByteAddress,
		wordAlignedAddress: startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		memoryMap: context.namespace.memory,
		wordAlignedSize: calculateWordAlignedSizeOfMemory(context.namespace.memory),
		ast,
		index,
	};
}
