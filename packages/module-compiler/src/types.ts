export type Argument = { type: 'literal'; value: number } | { type: 'identifier'; value: string };

export type AST = Array<{ instruction: string; arguments: Array<Argument> }>;

export enum MemoryTypes {
	DYNAMIC_ARRAY,
	STATIC_ARRAY,
	ARRAY_SIZE,
	INPUT_POINTER,
	OUTPUT,
	PRIVATE,
	NUMBER,
}

export type MemoryMap = Array<{
	type: MemoryTypes;
	address: number;
	byteAddress: number;
	id: string;
	default: number;
}>;
