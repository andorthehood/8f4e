import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseSliders(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, ...string[]];

			if (instruction === '#' && args[0] === 'slider') {
				const parsedMin = args[2] !== undefined ? parseFloat(args[2]) : undefined;
				const parsedMax = args[3] !== undefined ? parseFloat(args[3]) : undefined;
				const parsedStep = args[4] !== undefined ? parseFloat(args[4]) : undefined;

				return [
					...acc,
					{
						id: args[1],
						lineNumber: index,
						min: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
						max: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined,
						step: parsedStep !== undefined && !isNaN(parsedStep) ? parsedStep : undefined,
					},
				];
			}
			return acc;
		},
		[] as Array<{
			id: string;
			lineNumber: number;
			min: number | undefined;
			max: number | undefined;
			step: number | undefined;
		}>
	);
}
