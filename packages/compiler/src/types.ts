export enum MemoryTypes {
	DYNAMIC_ARRAY,
	STATIC_ARRAY,
	ARRAY_SIZE,
	INPUT_POINTER,
	OUTPUT,
	PRIVATE,
	NUMBER,
}

export type MemoryItemDescriptor<Memory> = {
	type: MemoryTypes;
	default: number;
	/** Relative address of the memory */
	address: Memory;
	id?: string;
};

export interface DynamicArray<Memory> extends Omit<MemoryItemDescriptor<Memory>, 'default'> {
	type: MemoryTypes.DYNAMIC_ARRAY;
	sizePointer: number;
	maxSize: number;
	default: number[];
}

export interface StaticArray<Memory> extends Omit<MemoryItemDescriptor<Memory>, 'default'> {
	type: MemoryTypes.STATIC_ARRAY;
	size: number;
	default: number[];
}

export interface InputPointer<Memory> extends Omit<MemoryItemDescriptor<Memory>, 'id'> {
	type: MemoryTypes.INPUT_POINTER;
	id: string;
}

export interface Output<Memory> extends Omit<MemoryItemDescriptor<Memory>, 'id'> {
	type: MemoryTypes.OUTPUT;
	id: string;
}

export interface Private<Memory> extends Omit<MemoryItemDescriptor<Memory>, 'id'> {
	type: MemoryTypes.PRIVATE;
}

export type MemoryMap<Memory> =
	| Private<Memory>
	| Output<Memory>
	| InputPointer<Memory>
	| StaticArray<Memory>
	| DynamicArray<Memory>
	| MemoryItemDescriptor<Memory>;

export interface CompiledModule<Memory = unknown> {
	functionBody: number[];
	moduleId: string;
	offset: number;
	memoryMap: MemoryMap<Memory>[];
}

export type MemoryBuffer = Int32Array;

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export type RelativeAddressCalculator = (nthWord: number) => number;

export type ModuleGenerator<TConfig = unknown, Memory = unknown> = (
	moduleId: string,
	offset: RelativeAddressCalculator,
	initialConfig?: TConfig
) => CompiledModule<Memory>;

export type EngineConfig = Record<string, number | string | EngineConfig[]>;

export interface Engine {
	name: string;
	config: EngineConfig;
}

export type ModuleState = Record<string, any>;

export type ModuleStateExtractor<T> = (memoryBuffer: MemoryBuffer, moduleAddress: number) => T;
export type ModuleStateInserter<T> = (moduleState: T, memoryBuffer: MemoryBuffer, moduleAddress: number) => void;

export interface Module {
	id: string;
	engine: Engine;
	state: ModuleState;
}

export type MemoryAddressLookup = Record<string, number>;
