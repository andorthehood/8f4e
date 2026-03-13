export interface SliderDirectiveData {
	id: string;
	lineNumber: number;
	min: number | undefined;
	max: number | undefined;
	step: number | undefined;
}

export function createSliderDirectiveData(args: string[], lineNumber: number): SliderDirectiveData {
	const parsedMin = args[1] !== undefined ? parseFloat(args[1]) : undefined;
	const parsedMax = args[2] !== undefined ? parseFloat(args[2]) : undefined;
	const parsedStep = args[3] !== undefined ? parseFloat(args[3]) : undefined;

	return {
		id: args[0],
		lineNumber,
		min: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
		max: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined,
		step: parsedStep !== undefined && !isNaN(parsedStep) ? parsedStep : undefined,
	};
}

export default function parseSliderDirectives(code: string[]): SliderDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'slider') {
			const args = commentMatch[2].trim().split(/\s+/);

			return [...acc, createSliderDirectiveData(args, index)];
		}
		return acc;
	}, [] as SliderDirectiveData[]);
}
