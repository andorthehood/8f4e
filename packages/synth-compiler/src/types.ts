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

export interface RelativeAddressCalculator {
	byte: (nthWord: number) => number;
	word: (nthWord: number) => number;
}

export type ModuleGenerator<TConfig = unknown> = (
	moduleId: string,
	offset: RelativeAddressCalculator,
	initialConfig?: TConfig
) => CompiledModule;

export type EngineConfig = Record<string, number | string | EngineConfig[]>;

export interface Engine {
	source: string;
}

export type ModuleState = Record<string, any>;

export type ModuleStateExtractor<T> = (memoryBuffer: MemoryBuffer, moduleAddress: number) => T;
export type ModuleStateInserter<T> = (moduleState: T, memoryBuffer: MemoryBuffer, moduleAddress: number) => void;

export interface Module {
	id: string;
	engine: Engine;
	state: ModuleState;
}

export type MemoryAddressLookup = Record<string, Record<string, number>>;

export const enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type Argument = { type: ArgumentType.LITERAL; value: number } | { type: ArgumentType.IDENTIFIER; value: string };

export type AST = Array<{ instruction: string; arguments: Array<Argument> }>;
