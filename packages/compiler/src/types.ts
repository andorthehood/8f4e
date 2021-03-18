import moduleSliders from '../../../src/state/mutators/modules/moduleSliders';

export interface CompiledModule {
	functionBody: number[];
	initialMemory: number[];
	memoryAddresses: { address: number; id: string }[];
	moduleId: string;
	offset: number;
}

export interface Connector {
	moduleId: string;
	connectorId: string;
}

export type MemoryBuffer = Uint32Array | Uint16Array;

export type Connection = [Connector, Connector];

export type ModuleGenerator = (
	moduleId: string,
	relative: (nthWord: number) => number,
	initialConfig?: { [key: string]: any }
) => CompiledModule;

export interface Module {
	id: string;
	engine: string;
	config: Object;
}
