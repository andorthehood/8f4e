/**
 * Regular expression for parsing instruction lines.
 * Matches an instruction keyword followed by up to 7 arguments, ignoring comments.
 * Format: instruction arg1 arg2 ... arg7 ; optional comment
 */
export const instructionParser =
	/^\s*([^\s;]+)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*(?:;.*|\s*)/;

/**
 * Checks if a line is a comment (starts with semicolon after optional whitespace).
 * @param line - The line to check.
 * @returns True if the line is a comment, false otherwise.
 */
export function isComment(line: string): boolean {
	return /^\s*;/.test(line);
}

/**
 * Checks if a line is a valid instruction (matches the instruction parser pattern).
 * @param line - The line to validate.
 * @returns True if the line is a valid instruction, false otherwise.
 */
export function isValidInstruction(line: string): boolean {
	return instructionParser.test(line);
}
