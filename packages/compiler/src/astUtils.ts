import { AST, MemoryTypes, MemoryMap } from './types';
import { WORD_LENGTH } from './consts';

const memoryKeywords = ['private', 'inputPointer', 'output', 'public', 'array', 'triggerInputPointer'];

export function collectLocals(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (line.instruction === 'local' && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
}

export function collectConsts(ast: AST): Record<string, number> {
	return Object.fromEntries(
		ast.reduce((acc, line) => {
			if (
				line.instruction === 'const' &&
				line.arguments[0].type === 'identifier' &&
				line.arguments[1].type === 'literal'
			) {
				acc.push([line.arguments[0].value, line.arguments[1].value]);
			}
			return acc;
		}, [] as [string, number][])
	);
}

function collectMemoryItemNames(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (memoryKeywords.includes(line.instruction) && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
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

export function getMemoryMap(ast: AST, startingByteAddress): MemoryMap {
	const memories = collectMemoryItemNames(ast);
	let addressCounter = 0;
	return new Map(
		ast
			.filter(({ instruction }) => {
				return memoryKeywords.includes(instruction);
			})
			.map(({ instruction, arguments: args }, index) => {
				const type = memoryInstructionNameToEnum(instruction);
				const wordSize = type === MemoryTypes.DYNAMIC_ARRAY ? (args[1].value as number) : 1;
				const wordAddress = addressCounter;
				addressCounter += wordSize;
				const id = args[0].value.toString();

				return [
					id,
					{
						type,
						address: wordAddress,
						size: wordSize,
						byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
						default:
							type === MemoryTypes.DYNAMIC_ARRAY
								? new Array(wordSize).fill(args[2].value)
								: args[1].type === 'literal'
								? args[1].value
								: startingByteAddress + memories.indexOf(args[1].value) * WORD_LENGTH,
					},
				];
			})
	);
}
