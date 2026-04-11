export interface PlotDirectiveData {
	startAddressMemoryId: string;
	lineNumber: number;
	length: string | number | undefined;
}

export function createPlotDirectiveData(args: string[], lineNumber: number): PlotDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	return {
		startAddressMemoryId: args[0],
		lineNumber,
		length: args[1] !== undefined && /^-?\d+$/.test(args[1]) ? Number.parseInt(args[1], 10) : args[1],
	};
}
