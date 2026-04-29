import { instructionParser } from '@8f4e/tokenizer';

const inputInstructions = new Set([
	'int*',
	'int8*',
	'int16*',
	'float*',
	'float64*',
	'int**',
	'int8**',
	'int16**',
	'float**',
	'float64**',
]);

function getFirstArgument(argumentText = ''): string | undefined {
	return argumentText.trim().split(/\s+/, 1)[0];
}

export default function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce<Array<{ id: string; lineNumber: number }>>((acc, line, index) => {
		const [, instruction, argumentText] = line.match(instructionParser) ?? [];

		if (inputInstructions.has(instruction)) {
			const id = getFirstArgument(argumentText);
			return id ? [...acc, { id, lineNumber: index }] : acc;
		}
		return acc;
	}, []);
}
