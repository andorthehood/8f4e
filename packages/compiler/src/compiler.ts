import { Type, createFunctionBody, createLocalDeclaration } from '@8f4e/bytecode-utils';

import instructions from './instructions';
import { AST, Argument, ArgumentType, MemoryMap, CompiledModule } from './types';
import { WORD_LENGTH } from './consts';
import { collectLocals, collectConsts, getMemoryMap } from './astUtils';

export { MemoryTypes, MemoryMap } from './types';

function parseArgument(argument: string): Argument {
	return /^-?[0-9]+$/.test(argument)
		? { value: parseInt(argument, 10), type: ArgumentType.LITERAL }
		: { value: argument, type: ArgumentType.IDENTIFIER };
}

function parseLine(line: string): AST[number] {
	// @ts-ignore
	const [, instruction, ...args] = line.match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/);

	return {
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

export function compileToAST(module: string) {
	const lines = module.split('\n');

	return lines
		.filter(line => !isComment(line))
		.filter(line => isValidInstruction(line))
		.map(line => {
			return parseLine(line);
		});
}

export function compileLine(
	line: AST[number],
	locals: string[],
	memory: MemoryMap,
	consts: Record<string, number>
): number[] {
	if (!instructions[line.instruction]) {
		throw `1001: Unrecognized instruction: '${line.instruction}'`;
	}
	return instructions[line.instruction](line, locals, memory, consts);
}

export function compile(module: string, moduleId: string, startingByteAddress: number): CompiledModule {
	const ast = compileToAST(module);
	const memoryMap = getMemoryMap(ast, startingByteAddress);
	const locals = collectLocals(ast);
	const consts = collectConsts(ast);

	const wa = ast
		.reduce((acc, line) => {
			acc.push(compileLine(line, locals, memoryMap, consts));
			return acc;
		}, [] as number[][])
		.flat();

	const [, lastMemoryItem] = Array.from(memoryMap).pop();

	return {
		moduleId,
		functionBody: createFunctionBody([createLocalDeclaration(Type.I32, locals.length)], wa),
		byteAddress: startingByteAddress,
		wordAddress: startingByteAddress / WORD_LENGTH,
		memoryMap,
		memoryWordSize: lastMemoryItem.address + lastMemoryItem.size,
	};
}
