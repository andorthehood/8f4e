export interface PlotDirectiveData {
	startAddressMemoryId: string;
	lineNumber: number;
	length: string | number;
	minValueOverride?: number;
	maxValueOverride?: number;
}

export function createPlotDirectiveData(args: string[], lineNumber: number): PlotDirectiveData | undefined {
	if (!args[0] || !args[1]) {
		return undefined;
	}

	const parsedArgs = args.slice(1);
	const hasRangeOverride =
		parsedArgs.length >= 3 &&
		/^-?\d*\.?\d+$/.test(parsedArgs[parsedArgs.length - 2]) &&
		/^-?\d*\.?\d+$/.test(parsedArgs[parsedArgs.length - 1]);
	const lengthArg = parsedArgs[0];
	const minValueOverride = hasRangeOverride ? Number.parseFloat(parsedArgs[parsedArgs.length - 2]) : undefined;
	const maxValueOverride = hasRangeOverride ? Number.parseFloat(parsedArgs[parsedArgs.length - 1]) : undefined;

	return {
		startAddressMemoryId: args[0],
		lineNumber,
		length: /^-?\d+$/.test(lengthArg) ? Number.parseInt(lengthArg, 10) : lengthArg,
		minValueOverride,
		maxValueOverride,
	};
}
