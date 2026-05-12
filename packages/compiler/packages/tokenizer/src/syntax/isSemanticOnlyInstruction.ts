import { semanticInstructionNames } from '@8f4e/compiler-spec';

const semanticOnlyInstructions = new Set<string>(semanticInstructionNames);

export default function isSemanticOnlyInstruction(instruction: string): boolean {
	return semanticOnlyInstructions.has(instruction);
}
