import isArrayDeclarationInstruction from './isArrayDeclarationInstruction';

const scalarMemoryDeclarationInstructions = new Set([
	'int',
	'float',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
]);

export default function isMemoryDeclarationInstruction(instruction: string): boolean {
	return scalarMemoryDeclarationInstructions.has(instruction) || isArrayDeclarationInstruction(instruction);
}
