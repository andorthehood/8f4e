/**
 * Parses pointer depth from an instruction string (e.g., "int**" returns 2).
 */
export default function getPointerDepth(instruction: string): number {
	const matches = instruction.match(/\*+$/);
	return matches ? matches[0].length : 0;
}
