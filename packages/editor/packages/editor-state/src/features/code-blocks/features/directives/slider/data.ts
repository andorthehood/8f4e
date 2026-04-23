export interface SliderDirectiveData {
	memoryId: string;
	lineNumber: number;
	min: number | undefined;
	max: number | undefined;
	step: number | undefined;
}

export function createSliderDirectiveData(args: string[], lineNumber: number): SliderDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	const parsedMin = args[1] !== undefined ? parseFloat(args[1]) : undefined;
	const parsedMax = args[2] !== undefined ? parseFloat(args[2]) : undefined;
	const parsedStep = args[3] !== undefined ? parseFloat(args[3]) : undefined;

	return {
		memoryId: args[0],
		lineNumber,
		min: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
		max: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined,
		step: parsedStep !== undefined && !isNaN(parsedStep) ? parsedStep : undefined,
	};
}
