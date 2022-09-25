export enum MemoryTypes {
	DYNAMIC_ARRAY,
	STATIC_ARRAY,
	ARRAY_SIZE,
	INPUT_POINTER,
	OUTPUT,
	PRIVATE,
	NUMBER,
}

export type MemoryItemDescriptor = {
	default: number;
	/** Relative address of the memory */
	address: number;
	id?: string;
};

export interface DynamicArray extends Omit<MemoryItemDescriptor, 'default'> {
	type: MemoryTypes.DYNAMIC_ARRAY;
	sizePointer: number;
	maxSize: number;
	default: number[];
}

export interface StaticArray extends Omit<MemoryItemDescriptor, 'default'> {
	type: MemoryTypes.STATIC_ARRAY;
	size: number;
	default: number[];
}

export interface InputPointer extends MemoryItemDescriptor {
	type: MemoryTypes.INPUT_POINTER;
}

export interface Output extends MemoryItemDescriptor {
	type: MemoryTypes.OUTPUT;
}

export interface Private extends MemoryItemDescriptor {
	type: MemoryTypes.PRIVATE;
}

export interface NumberValue extends MemoryItemDescriptor {
	type: MemoryTypes.NUMBER;
}

export interface ArraySize extends MemoryItemDescriptor {
	type: MemoryTypes.ARRAY_SIZE;
}

export type MemoryMap = Private | Output | InputPointer | StaticArray | DynamicArray | NumberValue | ArraySize;

export interface CompiledModule {
	functionBody: number[];
	moduleId: string;
	byteAddress: number;
	wordAddress: number;
	memoryMap: MemoryMap[];
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
