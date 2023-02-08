import { createFunctionBody, createLocalDeclaration } from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import instructions from './instructions';
import { AST, Argument, ArgumentType, CompiledModule, Namespace, MemoryMap } from './types';
import { WORD_LENGTH } from './consts';

export { MemoryTypes, MemoryMap } from './types';

function parseArgument(argument: string): Argument {
	return /^-?[0-9]+$/.test(argument)
		? { value: parseInt(argument, 10), type: ArgumentType.LITERAL }
		: { value: argument, type: ArgumentType.IDENTIFIER };
}

function parseLine(line: string, lineNumber: number): AST[number] {
	const [, instruction, ...args] = line.match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];

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

function isComment(line: string): boolean {
	return /\s*#/.test(line);
}

function isValidInstruction(line: string): boolean {
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
	startingByteAddress: number
): { byteCode: number[]; namespace: Namespace } {
	if (!instructions[line.instruction]) {
		throw `1001: Unrecognized instruction: '${line.instruction}'`;
	}
	return instructions[line.instruction](line, namespace, startingByteAddress);
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

export function compile(module: string[], startingByteAddress = 0): CompiledModule {
	const ast = compileToAST(module);
	const moduleId = getModuleId(ast);

	if (!moduleId) {
		throw '1007: Missing module ID';
	}

	let memory: MemoryMap = new Map();
	let locals: string[] = [];
	let consts: Record<string, number> = {};

	const wa = ast
		.reduce((acc, line) => {
			const { byteCode, namespace } = compileLine(line, { locals, memory, consts }, startingByteAddress);
			consts = namespace.consts;
			locals = namespace.locals;
			memory = namespace.memory;
			acc.push(byteCode);
			return acc;
		}, [] as number[][])
		.flat();

	const [, lastMemoryItem = { relativeWordAddress: 0, wordSize: 0 }] = Array.from(memory).pop() || [];

	return {
		moduleId,
		functionBody: createFunctionBody([createLocalDeclaration(Type.I32, locals.length)], wa),
		byteAddress: startingByteAddress,
		wordAddress: startingByteAddress / WORD_LENGTH,
		memoryMap: memory,
		memoryWordSize: lastMemoryItem.relativeWordAddress + lastMemoryItem.wordSize,
		ast,
	};
}
