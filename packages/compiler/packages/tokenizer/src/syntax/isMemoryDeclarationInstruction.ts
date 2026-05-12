import { memoryDeclarationInstructions } from '@8f4e/compiler-spec';

const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);

export default function isMemoryDeclarationInstruction(instruction: string): boolean {
	return memoryDeclarationInstructionSet.has(instruction);
}
