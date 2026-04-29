import { isConstantName } from '@8f4e/tokenizer';
import { instructionParser } from '@8f4e/tokenizer';

function getFirstArgument(argumentText = ''): string | undefined {
	return argumentText.trim().split(/\s+/, 1)[0];
}

export default function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, argumentText] = line.match(instructionParser) ?? [];
			const firstArg = getFirstArgument(argumentText);
			const isScalarDeclaration = instruction === 'int' || instruction === 'float' || instruction === 'float64';

			if (
				isScalarDeclaration ||
				instruction === 'int[]' ||
				instruction === 'float[]' ||
				instruction === 'float64[]' ||
				instruction === 'int8[]' ||
				instruction === 'int16[]'
			) {
				if (!firstArg) {
					if (!isScalarDeclaration) {
						return acc;
					}

					return [...acc, { id: '__anonymous__' + index, lineNumber: index }];
				}

				let id: string;
				// If args[0] is a number or a constant name, it's an anonymous memory allocation.
				if (!isNaN(Number(firstArg)) || isConstantName(firstArg)) {
					id = '__anonymous__' + index;
				} else {
					if (firstArg.startsWith('_')) {
						return acc;
					}
					id = firstArg;
				}

				return [...acc, { id, lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
