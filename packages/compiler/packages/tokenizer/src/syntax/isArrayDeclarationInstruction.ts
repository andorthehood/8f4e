import { arrayMemoryDeclarationInstructions } from '@8f4e/compiler-spec';

const arrayDeclarationInstructions = new Set<string>(arrayMemoryDeclarationInstructions);

/**
 * Checks is array declaration instruction.
 *
 * @param instruction - Instruction name to inspect.
 * @returns Whether the array declaration instruction condition is true.
 */
export default function isArrayDeclarationInstruction(instruction: string): boolean {
	return arrayDeclarationInstructions.has(instruction);
}
