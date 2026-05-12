import { memoryDeclarationInstructions as specMemoryDeclarationInstructions } from '@8f4e/compiler-spec';

import array from './array';
import float from './float';
import float64 from './float64';
import int from './int';
import int8 from './int8';
import int16 from './int16';

import { validateInstruction } from '../../stackAnalysis/validateInstruction';

import type { AST, CompilationContext, InstructionCompiler, MemoryDeclarationInstruction } from '@8f4e/compiler-spec';

function getDeclarationCompiler(instruction: MemoryDeclarationInstruction): InstructionCompiler {
	if (instruction.endsWith('[]')) {
		return array as InstructionCompiler;
	}
	if (instruction.startsWith('int8')) {
		return int8 as InstructionCompiler;
	}
	if (instruction.startsWith('int16')) {
		return int16 as InstructionCompiler;
	}
	if (instruction.startsWith('float64')) {
		return float64 as InstructionCompiler;
	}
	if (instruction.startsWith('float')) {
		return float as InstructionCompiler;
	}
	return int as InstructionCompiler;
}

export const declarationCompilers = Object.fromEntries(
	specMemoryDeclarationInstructions.map(instruction => [instruction, getDeclarationCompiler(instruction)])
) as Record<MemoryDeclarationInstruction, InstructionCompiler>;

export const memoryDeclarationInstructions = new Set<MemoryDeclarationInstruction>(specMemoryDeclarationInstructions);

export function isMemoryDeclarationInstruction(instruction: string): instruction is MemoryDeclarationInstruction {
	return memoryDeclarationInstructions.has(instruction as MemoryDeclarationInstruction);
}

export function applyMemoryDeclarationLine(line: AST[number], context: CompilationContext) {
	if (!line.isMemoryDeclaration) {
		return context;
	}

	validateInstruction(line, context);
	const compileDeclaration = declarationCompilers[
		line.instruction as MemoryDeclarationInstruction
	] as InstructionCompiler;
	return compileDeclaration(line, context);
}
