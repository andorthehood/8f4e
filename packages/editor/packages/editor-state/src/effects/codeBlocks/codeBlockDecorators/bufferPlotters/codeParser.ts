import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseBufferPlotters(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
				never,
				string,
				string,
				string,
				string,
				string | undefined,
			];

			if (instruction === 'plot') {
				return [
					...acc,
					{
						bufferMemoryId: args[0],
						lineNumber: index,
						minValue: parseInt(args[1], 10) || -8,
						maxValue: parseInt(args[2], 10) || 8,
						bufferLengthMemoryId: args[3] || undefined,
					},
				];
			}

			return acc;
		},
		[] as Array<{
			bufferMemoryId: string;
			lineNumber: number;
			minValue: number;
			maxValue: number;
			bufferLengthMemoryId: string | undefined;
		}>
	);
}
