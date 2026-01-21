import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseSliders(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
				never,
				string,
				string,
				string,
				string,
				string,
			];

			if (instruction === '#' && args[0] === 'slider') {
				return [
					...acc,
					{
						id: args[1],
						lineNumber: index,
						min: args[2] !== undefined ? parseFloat(args[2]) : undefined,
						max: args[3] !== undefined ? parseFloat(args[3]) : undefined,
						step: args[4] !== undefined ? parseFloat(args[4]) : undefined,
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
