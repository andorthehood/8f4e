import buffer from './buffer';
import float from './float';
import float64 from './float64';
import int from './int';
import int16 from './int16';

import type { AST, CompilationContext, InstructionCompiler } from '../../types';

export const declarationCompilers = {
	int,
	float,
	'int*': int,
	'int**': int,
	'int16*': int16,
	'int16**': int16,
	'float*': float,
	'float**': float,
	float64,
	'float64*': float64,
	'float64**': float64,
	'float[]': buffer,
	'int[]': buffer,
	'int8[]': buffer,
	'int8u[]': buffer,
	'int16[]': buffer,
	'int16u[]': buffer,
	'int32[]': buffer,
	'float*[]': buffer,
	'float**[]': buffer,
	'int*[]': buffer,
	'int**[]': buffer,
	'float64[]': buffer,
	'float64*[]': buffer,
	'float64**[]': buffer,
} as const satisfies Record<string, InstructionCompiler>;

export type MemoryDeclarationInstruction = keyof typeof declarationCompilers;

export const memoryDeclarationInstructions = new Set<MemoryDeclarationInstruction>(
	Object.keys(declarationCompilers) as MemoryDeclarationInstruction[]
);

export function isMemoryDeclarationInstruction(instruction: string): instruction is MemoryDeclarationInstruction {
	return memoryDeclarationInstructions.has(instruction as MemoryDeclarationInstruction);
}

export function applyMemoryDeclarationLine(line: AST[number], context: CompilationContext) {
	if (!isMemoryDeclarationInstruction(line.instruction)) {
		return context;
	}

	return declarationCompilers[line.instruction](line, context);
}
