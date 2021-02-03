export type ModuleGenerator = (
	memoryStartAddress: number
) => {
	functionBody: number[];
	memoryStartAddress: number;
	initialMemory: number[];
	outputs: { address: number; label: string }[];
	inputs: { address: number; label: string }[];
};
