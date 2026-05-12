import { arrayMemoryDeclarationInstructions, scalarMemoryDeclarationInstructions } from '@8f4e/compiler-spec';
import { isConstantName } from '@8f4e/tokenizer';
import { instructionParser } from '@8f4e/tokenizer';

const scalarOutputInstructions = new Set<string>(
	scalarMemoryDeclarationInstructions.filter(instruction => !instruction.includes('*'))
);

const outputInstructions = new Set<string>([
	...scalarOutputInstructions,
	...arrayMemoryDeclarationInstructions.filter(instruction => !instruction.includes('*')),
]);

function getFirstArgument(argumentText = ''): string | undefined {
	return argumentText.trim().split(/\s+/, 1)[0];
}

export default function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, argumentText] = line.match(instructionParser) ?? [];
			const firstArg = getFirstArgument(argumentText);
			const isScalarDeclaration = scalarOutputInstructions.has(instruction);

			if (outputInstructions.has(instruction)) {
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
