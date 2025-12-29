import { instructionParser } from '@8f4e/compiler/syntax';

export function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce<Array<{ id: string; lineNumber: number }>>((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

		if (instruction === 'int*' || instruction === 'float*' || instruction === 'int**' || instruction === 'float**') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}
