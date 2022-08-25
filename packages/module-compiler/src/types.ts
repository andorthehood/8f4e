export const enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type Argument = { type: ArgumentType.LITERAL; value: number } | { type: ArgumentType.IDENTIFIER; value: string };

export type AST = Array<{ instruction: string; arguments: Array<Argument> }>;

export enum MemoryTypes {
	DYNAMIC_ARRAY,
	STATIC_ARRAY,
	ARRAY_SIZE,
	INPUT_POINTER,
	OUTPUT,
	PRIVATE,
	NUMBER,
	ARRAY,
}

export type MemoryMap = Array<{
	type: MemoryTypes;
	address: number;
	byteAddress: number;
	id: string;
	size: number;
	default: number | number[];
	usage: number;
}>;
