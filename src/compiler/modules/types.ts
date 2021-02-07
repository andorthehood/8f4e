export type Module = {
	moduleId: string;
	functionBody: number[];
	offset: number;
	initialMemory: number[];
	memoryAddresses: { address: number; id: string; isInputPointer?: boolean }[];
};

export type ModuleGenerator = (moduleId: string, offset: number) => Module;
