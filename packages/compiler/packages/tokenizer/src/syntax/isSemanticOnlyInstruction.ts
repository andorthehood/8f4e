const semanticOnlyInstructions = new Set(['module', 'moduleEnd', 'constants', 'constantsEnd', 'const', 'use', 'init']);

export default function isSemanticOnlyInstruction(instruction: string): boolean {
	return semanticOnlyInstructions.has(instruction);
}
