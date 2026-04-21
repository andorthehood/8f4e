const semanticOnlyInstructions = new Set([
	'module',
	'moduleEnd',
	'constants',
	'constantsEnd',
	'const',
	'use',
	'init',
	'#follow',
]);

export default function isSemanticOnlyInstruction(instruction: string): boolean {
	return semanticOnlyInstructions.has(instruction);
}
