export function getDeclarationBaseType(instruction: string): 'int' | 'int8' | 'int16' | 'float' | 'float64' {
	if (instruction.startsWith('int8')) return 'int8';
	if (instruction.startsWith('int16')) return 'int16';
	if (instruction.startsWith('float64')) return 'float64';
	if (instruction.startsWith('float')) return 'float';
	return 'int';
}
