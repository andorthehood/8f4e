import instructionParser from './instructionParser';

/**
 * Extracts the identifier provided to the first constants instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The constants identifier or an empty string when none is found.
 */
export default function getConstantsId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, argumentText = ''] = code[i].match(instructionParser) || [];
		if (instruction === 'constants') {
			return argumentText.trim().split(/\s+/)[0] || '';
		}
	}
	return '';
}
