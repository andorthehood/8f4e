export type Module = {
	moduleId: string;
	functionBody: number[];
	memoryStartAddress: number;
	initialMemory: number[];
	outputs: { address: number; id: string }[];
	inputs?: { address: number; id: string }[];
};

export type ModuleGenerator = (moduleId: string, memoryStartAddress: number) => Module;
