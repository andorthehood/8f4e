import array from './array';
import float from './float';
import float64 from './float64';
import int from './int';
import int8 from './int8';
import int16 from './int16';

import type { AST, CompilationContext, InstructionCompiler } from '@8f4e/compiler-types';

export const declarationCompilers = {
	int,
	float,
	'int*': int,
	'int**': int,
	'int8*': int8,
	'int8**': int8,
	'int16*': int16,
	'int16**': int16,
	'float*': float,
	'float**': float,
	float64,
	'float64*': float64,
	'float64**': float64,
	'float[]': array,
	'int[]': array,
	'int8[]': array,
	'int8u[]': array,
	'int16[]': array,
	'int16u[]': array,
	'int32[]': array,
	'float*[]': array,
	'float**[]': array,
	'int*[]': array,
	'int**[]': array,
	'float64[]': array,
	'float64*[]': array,
	'float64**[]': array,
} as const satisfies Record<string, InstructionCompiler>;

export type MemoryDeclarationInstruction = keyof typeof declarationCompilers;

export const memoryDeclarationInstructions = new Set<MemoryDeclarationInstruction>(
	Object.keys(declarationCompilers) as MemoryDeclarationInstruction[]
);

export function isMemoryDeclarationInstruction(instruction: string): instruction is MemoryDeclarationInstruction {
	return memoryDeclarationInstructions.has(instruction as MemoryDeclarationInstruction);
}

export function applyMemoryDeclarationLine(line: AST[number], context: CompilationContext) {
	if (!line.isMemoryDeclaration) {
		return context;
	}

	return declarationCompilers[line.instruction as MemoryDeclarationInstruction](line, context);
}
