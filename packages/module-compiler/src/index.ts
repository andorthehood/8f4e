import { createFunctionBody, createLocalDeclaration, Type } from '@8f4e/bytecode-utils';
import instructions from './instructions';
import { AST, Argument, MemoryTypes, MemoryMap, ArgumentType } from './types';
import { WORD_LENGTH } from './consts';

export { MemoryTypes, MemoryMap } from './types';

const memoryKeywords = ['private', 'inputPointer', 'output', 'public', 'array'];

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

function collectLocals(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (line.instruction === 'local' && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
}

function collectMemoryItemNames(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (memoryKeywords.includes(line.instruction) && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
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
	startingByteAddress: number
): number[] {
	if (!instructions[line.instruction]) {
		throw `1001: Unrecognized instruction: '${line.instruction}'`;
	}
	return instructions[line.instruction](line, locals, memory, startingByteAddress);
}

function memoryInstructionNameToEnum(name: string): MemoryTypes {
	switch (name) {
		case 'private':
			return MemoryTypes.PRIVATE;
		case 'inputPointer':
			return MemoryTypes.INPUT_POINTER;
		case 'output':
			return MemoryTypes.OUTPUT;
		case 'array':
			return MemoryTypes.DYNAMIC_ARRAY;
		case 'public':
		default:
			return MemoryTypes.NUMBER;
	}
}

function countUsage(ast: AST, identifier: string): number {
	return ast.reduce((acc, line) => {
		if (line.instruction !== 'push') {
			return acc;
		}
		if (
			line.arguments.some(({ value }) => {
				return value === identifier;
			})
		) {
			return acc + 1;
		}
		return acc;
	}, 0);
}

function findLastIndex<T>(array: Array<T>, predicate: (item?: T, index?: number, array?: Array<T>) => boolean): number {
	let index = array.length;
	while (index--) {
		if (predicate(array[index], index, array)) {
			return index;
		}
	}
	return 0;
}

function addLocalsForOverlyUsedMemories(memoryMap: MemoryMap, ast: AST): void {
	const overused = memoryMap.filter(({ usage }) => usage > 1);
	overused.forEach(({ id }) => {
		const index = findLastIndex(ast, item => {
			return memoryKeywords.includes(item.instruction);
		});
		ast.splice(
			index,
			0,
			...[
				{ instruction: 'local', arguments: [{ type: ArgumentType.IDENTIFIER, value: id } as Argument] },
				{ instruction: 'push', arguments: [{ type: ArgumentType.IDENTIFIER, value: id } as Argument] },
				{ instruction: 'localSet', arguments: [{ type: ArgumentType.IDENTIFIER, value: id } as Argument] },
			]
		);
	});
}

function getMemoryMap(ast: AST, startingByteAddress): MemoryMap {
	const memories = collectMemoryItemNames(ast);
	let addressCounter = 0;
	return ast
		.filter(({ instruction }) => {
			return memoryKeywords.includes(instruction);
		})
		.map(({ instruction, arguments: args }, index) => {
			const type = memoryInstructionNameToEnum(instruction);
			const wordSize = type === MemoryTypes.DYNAMIC_ARRAY ? (args[1].value as number) : 1;
			const wordAddress = addressCounter;
			addressCounter += wordSize;

			return {
				type,
				address: wordAddress,
				size: wordSize,
				byteAddress: startingByteAddress + index * WORD_LENGTH,
				id: args[0].value.toString(),
				usage: countUsage(ast, args[0].value.toString()),
				default:
					type === MemoryTypes.DYNAMIC_ARRAY
						? new Array(wordSize).fill(args[2].value)
						: args[1].type === 'literal'
						? args[1].value
						: startingByteAddress + memories.indexOf(args[1].value) * WORD_LENGTH,
			};
		});
}

export function compile(
	module: string,
	moduleId: string,
	startingByteAddress: number
): { moduleId: string; functionBody: number[]; byteAddress: number; wordAddress: number; memoryMap } {
	const ast = compileToAST(module);
	const memoryMap = getMemoryMap(ast, startingByteAddress);
	const locals = collectLocals(ast);

	const wa = ast
		.reduce((acc, line) => {
			acc.push(compileLine(line, locals, memoryMap, startingByteAddress));
			return acc;
		}, [] as number[][])
		.flat();

	return {
		moduleId,
		functionBody: createFunctionBody([createLocalDeclaration(Type.I32, locals.length)], wa),
		byteAddress: startingByteAddress,
		wordAddress: startingByteAddress / WORD_LENGTH,
		memoryMap,
	};
}
