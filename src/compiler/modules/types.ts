export type Module = {
	moduleId: string;
	functionBody: number[];
	offset: number;
	initialMemory: number[];
	outputs: { address: number; id: string }[];
	inputs?: { address: number; id: string }[];
};

export type ModuleGenerator = (moduleId: string, offset: number) => Module;
