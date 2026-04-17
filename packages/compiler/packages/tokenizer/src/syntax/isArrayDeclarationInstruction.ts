const arrayDeclarationInstructionPattern =
	/^(?:float(?:\*{1,2})?|float64(?:\*{1,2})?|int(?:8u?|16u?|32|\*{1,2})?)\[\]$/;

export default function isArrayDeclarationInstruction(instruction: string): boolean {
	return arrayDeclarationInstructionPattern.test(instruction);
}
