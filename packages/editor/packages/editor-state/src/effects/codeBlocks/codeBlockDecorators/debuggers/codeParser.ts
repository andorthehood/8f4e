import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseDebuggers(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

			if (instruction === 'debug') {
				return [...acc, { id: args[0], lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
