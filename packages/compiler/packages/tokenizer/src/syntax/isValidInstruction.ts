import instructionParser from './instructionParser';

/**
 * Checks if a line is a valid instruction (matches the instruction parser pattern).
 * @param line - The line to validate.
 * @returns True if the line is a valid instruction, false otherwise.
 */
export default function isValidInstruction(line: string): boolean {
	return instructionParser.test(line);
}
