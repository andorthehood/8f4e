import { isConstantName } from '@8f4e/syntax-rules';

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
				// If args[0] is a number or a constant name, it's an anonymous memory allocation.
				if (!isNaN(Number(args[0])) || isConstantName(args[0])) {
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
