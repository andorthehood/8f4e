import { createFunctionBody, createLocalDeclaration } from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import instructions, { Instruction } from './instructions';
import { AST, Argument, ArgumentType, CompiledModule, Namespace, CompilationContext } from './types';
import { WORD_LENGTH } from './consts';
import { ErrorCode, getError } from './errors';

export { MemoryTypes, MemoryMap } from './types';

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
	const [, instruction, ...args] = (line.match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)\s*(\S*)/) || []) as [
		never,
		Instruction,
		string,
		string
	];

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
	return /\s*#/.test(line);
}

export function isValidInstruction(line: string): boolean {
	return /\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/.test(line);
}

export function compileToAST(module: string[]) {
	return module
		.map((line, index) => [index, line] as [number, string])
		.filter(([, line]) => !isComment(line))
		.filter(([, line]) => isValidInstruction(line))
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

export function compile(ast: AST, globals: Namespace['consts'], startingByteAddress = 0): CompiledModule {
	const context: CompilationContext = {
		namespace: {
			memory: new Map(),
			locals: [],
			consts: { ...globals },
			moduleName: undefined,
		},
		stack: [],
		blockStack: [],
		startingByteAddress,
	};

	const wa = ast
		.reduce((acc, line) => {
			const {
				byteCode,
				context: { namespace, stack: newStack, blockStack: newBlockStack },
			} = compileLine(line, context);
			context.namespace.consts = namespace.consts;
			context.namespace.locals = namespace.locals;
			context.namespace.memory = namespace.memory;
			context.namespace.moduleName = namespace.moduleName;
			context.stack = newStack;
			context.blockStack = newBlockStack;
			acc.push(byteCode);
			return acc;
		}, [] as number[][])
		.flat();

	const [, lastMemoryItem = { relativeWordAddress: 0, wordSize: 0 }] = Array.from(context.namespace.memory).pop() || [];

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
		functionBody: createFunctionBody([createLocalDeclaration(Type.I32, context.namespace.locals.length)], wa),
		byteAddress: startingByteAddress,
		wordAddress: startingByteAddress / WORD_LENGTH,
		memoryMap: context.namespace.memory,
		memoryWordSize: lastMemoryItem.relativeWordAddress + lastMemoryItem.wordSize,
		ast,
	};
}
