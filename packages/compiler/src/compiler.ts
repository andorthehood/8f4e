import { createFunctionBody, createLocalDeclaration } from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import instructions, { Instruction } from './instructions';
import { AST, Argument, ArgumentType, CompiledModule, Namespace, Stack } from './types';
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
	const [, instruction, ...args] = (line.match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || []) as [
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
	return /\s*(\S+)\s*(\S*)\s*(\S*)/.test(line);
}

export function compileToAST(module: string[]) {
	return module
		.map((line, index) => [index + 1, line] as [number, string])
		.filter(([, line]) => !isComment(line))
		.filter(([, line]) => isValidInstruction(line))
		.map(([lineNumber, line]) => {
			return parseLine(line, lineNumber);
		});
}

export function compileLine(
	line: AST[number],
	namespace: Namespace,
	stack: Stack,
	startingByteAddress: number
): { byteCode: number[]; namespace: Namespace; stack: Stack } {
	if (!instructions[line.instruction]) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line);
	}
	return instructions[line.instruction](line, namespace, stack, startingByteAddress);
}

function getModuleId(ast: AST): string | undefined {
	return (
		ast
			.find(
				line => line.instruction === 'module' && line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER
			)
			?.arguments[0].value.toString() || undefined
	);
}

export function compile(ast: AST, globals: Namespace['consts'], startingByteAddress = 0): CompiledModule {
	const moduleId = getModuleId(ast);

	if (!moduleId) {
		throw getError(ErrorCode.MISSING_MODULE_ID);
	}

	let memory: Namespace['memory'] = new Map();
	let locals: Namespace['locals'] = [];
	let consts: Namespace['consts'] = { ...globals };
	let stack: Stack = [];

	const wa = ast
		.reduce((acc, line) => {
			const {
				byteCode,
				namespace,
				stack: newStack,
			} = compileLine(line, { locals, memory, consts }, stack, startingByteAddress);
			consts = namespace.consts;
			locals = namespace.locals;
			memory = namespace.memory;
			stack = newStack;
			acc.push(byteCode);
			return acc;
		}, [] as number[][])
		.flat();

	const [, lastMemoryItem = { relativeWordAddress: 0, wordSize: 0 }] = Array.from(memory).pop() || [];

	return {
		id: moduleId,
		functionBody: createFunctionBody([createLocalDeclaration(Type.I32, locals.length)], wa),
		byteAddress: startingByteAddress,
		wordAddress: startingByteAddress / WORD_LENGTH,
		memoryMap: memory,
		memoryWordSize: lastMemoryItem.relativeWordAddress + lastMemoryItem.wordSize,
		ast,
	};
}
