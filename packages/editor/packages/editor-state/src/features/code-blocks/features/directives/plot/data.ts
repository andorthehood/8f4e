export interface PlotDirectiveData {
	bufferMemoryId: string;
	lineNumber: number;
	minValue: number;
	maxValue: number;
	bufferLengthMemoryId: string | undefined;
}

export function createPlotDirectiveData(args: string[], lineNumber: number): PlotDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	const parsedMin = args[1] !== undefined ? parseInt(args[1], 10) : undefined;
	const parsedMax = args[2] !== undefined ? parseInt(args[2], 10) : undefined;

	return {
		bufferMemoryId: args[0],
		lineNumber,
		minValue: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : -8,
		maxValue: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : 8,
		bufferLengthMemoryId: args[3] || undefined,
	};
}
