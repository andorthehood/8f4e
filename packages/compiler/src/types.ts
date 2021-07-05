export interface CompiledModule {
	functionBody: number[];
	initialMemory: number[];
	memoryAddresses: { address: number; id: string; default?: number }[];
	moduleId: string;
	offset: number;
}

export type MemoryBuffer = Int32Array;

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export type RelativeAddressCalculator = (nthWord: number) => number;

export type ModuleGenerator<TConfig = unknown> = (
	moduleId: string,
	offset: RelativeAddressCalculator,
	initialConfig?: TConfig
) => CompiledModule;

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
