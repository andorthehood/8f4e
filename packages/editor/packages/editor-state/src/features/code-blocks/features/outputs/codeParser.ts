import { isConstantName } from '@8f4e/tokenizer';
import { instructionParser } from '@8f4e/tokenizer';

export default function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];
			const isScalarDeclaration = instruction === 'int' || instruction === 'float' || instruction === 'float64';

			if (
				isScalarDeclaration ||
				instruction === 'int[]' ||
				instruction === 'float[]' ||
				instruction === 'float64[]' ||
				instruction === 'int8[]' ||
				instruction === 'int16[]'
			) {
				if (!args[0]) {
					if (!isScalarDeclaration) {
						return acc;
					}

					return [...acc, { id: '__anonymous__' + index, lineNumber: index }];
				}

				let id: string;
				// If args[0] is a number or a constant name, it's an anonymous memory allocation.
				if (!isNaN(Number(args[0])) || isConstantName(args[0])) {
					id = '__anonymous__' + index;
				} else {
					if (args[0].startsWith('_')) {
						return acc;
					}
					id = args[0];
				}

				return [...acc, { id, lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
