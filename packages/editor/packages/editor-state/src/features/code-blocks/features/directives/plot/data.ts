export interface PlotDirectiveData {
	arrayMemoryId: string;
	lineNumber: number;
	minValue: number;
	maxValue: number;
	arrayLengthMemoryId: string | undefined;
}

export function createPlotDirectiveData(args: string[], lineNumber: number): PlotDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	const parsedMin = args[1] !== undefined ? parseInt(args[1], 10) : undefined;
	const parsedMax = args[2] !== undefined ? parseInt(args[2], 10) : undefined;

	return {
		arrayMemoryId: args[0],
		lineNumber,
		minValue: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : -8,
		maxValue: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : 8,
		arrayLengthMemoryId: args[3] || undefined,
	};
}
