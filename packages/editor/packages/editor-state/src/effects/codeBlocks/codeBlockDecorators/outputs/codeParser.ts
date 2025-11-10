import instructionParser from '../instructionParser';

export function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

			if (instruction === 'int' || instruction === 'float' || instruction === 'int[]' || instruction === 'float[]') {
				return [...acc, { id: args[0], lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
