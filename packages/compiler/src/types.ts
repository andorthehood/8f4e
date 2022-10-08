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

export type MemoryMap = Map<
	string,
	{
		type: MemoryTypes;
		address: number;
		byteAddress: number;
		size: number;
		default: number | number[];
		usage: number;
	}
>;

export interface CompiledModule {
	functionBody: number[];
	moduleId: string;
	byteAddress: number;
	wordAddress: number;
	memoryMap: MemoryMap;
}

export type MemoryBuffer = Int32Array;

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export type ModuleStateExtractor<T> = (memoryBuffer: MemoryBuffer, moduleAddress: number) => T;
export type ModuleStateInserter<T> = (moduleState: T, memoryBuffer: MemoryBuffer, moduleAddress: number) => void;

export interface Module<ModuleState = Record<string, any>> {
	id: string;
	engine: {
		source: string;
	};
	state: ModuleState;
}

export type MemoryAddressLookup = Record<string, Record<string, number>>;

export const enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type Argument = { type: ArgumentType.LITERAL; value: number } | { type: ArgumentType.IDENTIFIER; value: string };

export type AST = Array<{ instruction: string; arguments: Array<Argument> }>;

export interface TestModule {
	memory: Int32Array;
	test: CallableFunction;
	reset: () => void;
	wat: string;
	program: Uint8Array;
	memoryMap: MemoryMap;
	memoryGet: (address: number | string, offset?: number) => number;
	memorySet: (address: number | string, value: number, offset?: number) => void;
}
