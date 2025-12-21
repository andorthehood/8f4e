import instructionParser from '../instructionParser';

export function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

			if (instruction === 'int' || instruction === 'float' || instruction === 'int[]' || instruction === 'float[]') {
				if (!args[0]) {
					return acc;
				}

				let id: string;
				// If args[0] is a number or starts with a capital letter, it's an anonymous memory allocation.
				if (!isNaN(Number(args[0])) || (args[0][0] >= 'A' && args[0][0] <= 'Z')) {
					id = '__anonymous__' + index;
				} else {
					id = args[0];
				}

				return [...acc, { id, lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
