import { compilerSourceBlockInstructionByType } from '@8f4e/compiler-spec';

import instructionParser from './instructionParser';

const prototypeInstruction = compilerSourceBlockInstructionByType.prototype.start;

/**
 * Extracts the identifier provided to the first prototype instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The prototype identifier or an empty string when none is found.
 */
export default function getPrototypeId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, argumentText = ''] = code[i].match(instructionParser) || [];
		if (instruction === prototypeInstruction) {
			return argumentText.trim().split(/\s+/)[0] || '';
		}
	}
	return '';
}
