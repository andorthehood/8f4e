import moduleSliders from '../../../src/state/mutators/modules/moduleSliders';

export interface CompiledModule {
	functionBody: number[];
	initialMemory: number[];
	memoryAddresses: { address: number; id: string; default?: number }[];
	moduleId: string;
	offset: number;
}

export interface Connector {
	moduleId: string;
	connectorId: string;
}

export type MemoryBuffer = Uint32Array | Uint16Array;

export type Connection = [Connector, Connector];

export type RelativeAddressCalculator = (nthWord: number) => number;

export type InitialConfig = { [key: string]: number };

export type ModuleGenerator = (
	moduleId: string,
	offset: RelativeAddressCalculator,
	initialConfig?: InitialConfig
) => CompiledModule;

export interface Module {
	id: string;
	engine: string;
	config: Object;
}
