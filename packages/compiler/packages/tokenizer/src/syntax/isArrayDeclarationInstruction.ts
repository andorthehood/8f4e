import { arrayMemoryDeclarationInstructions } from '@8f4e/compiler-spec';

const arrayDeclarationInstructions = new Set<string>(arrayMemoryDeclarationInstructions);

export default function isArrayDeclarationInstruction(instruction: string): boolean {
	return arrayDeclarationInstructions.has(instruction);
}
