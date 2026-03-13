export interface PlotDirectiveData {
	bufferMemoryId: string;
	lineNumber: number;
	minValue: number;
	maxValue: number;
	bufferLengthMemoryId: string | undefined;
}

export function createPlotDirectiveData(args: string[], lineNumber: number): PlotDirectiveData {
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

export default function parsePlotDirectives(code: string[]): PlotDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'plot') {
			const args = commentMatch[2].trim().split(/\s+/);
			return [...acc, createPlotDirectiveData(args, index)];
		}

		return acc;
	}, [] as PlotDirectiveData[]);
}
