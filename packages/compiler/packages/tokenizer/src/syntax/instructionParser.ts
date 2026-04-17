/**
 * Regular expression for parsing instruction lines.
 * Matches an instruction keyword followed by up to 7 arguments, ignoring comments.
 * Format: instruction arg1 arg2 ... arg7 ; optional comment
 */
const instructionParser =
	/^\s*([^\s;]+)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*(?:;.*|\s*)/;

export default instructionParser;
