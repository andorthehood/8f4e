import instructionParser from './instructionParser';

/**
 * Extracts the identifier provided to the first function instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The function identifier or an empty string when none is found.
 */
export default function getFunctionId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'function') {
			return args[0] || '';
		}
	}
	return '';
}
