import { memoryDeclarationInstructions } from '@8f4e/compiler-spec';

const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);

/**
 * Checks is memory declaration instruction.
 *
 * @param instruction - Instruction name to inspect.
 * @returns Whether the memory declaration instruction condition is true.
 */
export default function isMemoryDeclarationInstruction(instruction: string): boolean {
	return memoryDeclarationInstructionSet.has(instruction);
}
