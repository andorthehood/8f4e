import type { CompilationContext, MemoryDeclarationInstruction, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import {
	isScalarMemoryDeclarationLine,
	memoryDeclarationInstructions as specMemoryDeclarationInstructions,
} from '@8f4e/compiler-spec';
import { validateInstruction } from '../../stackAnalysis/validateInstruction';
import array from './array';
import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import float from './float';
import float64 from './float64';
import int from './int';
import int8 from './int8';
import int8u from './int8u';
import int16 from './int16';
import int16u from './int16u';

function getDeclarationCompiler(instruction: MemoryDeclarationInstruction): MemoryDeclarationCompiler {
	if (instruction.endsWith('[]')) {
		return array as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('int8u')) {
		return int8u as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('int8')) {
		return int8 as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('int16u')) {
		return int16u as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('int16')) {
		return int16 as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('float64')) {
		return float64 as MemoryDeclarationCompiler;
	}
	if (instruction.startsWith('float')) {
		return float as MemoryDeclarationCompiler;
	}
	return int as MemoryDeclarationCompiler;
}

/** Semantic declaration compilers keyed by memory declaration instruction. */
export const declarationCompilers = Object.fromEntries(
	specMemoryDeclarationInstructions.map(instruction => [instruction, getDeclarationCompiler(instruction)])
) as Record<MemoryDeclarationInstruction, MemoryDeclarationCompiler>;

/** Set of instructions handled by semantic memory declaration compilers. */
export const memoryDeclarationInstructions = new Set<MemoryDeclarationInstruction>(specMemoryDeclarationInstructions);

/**
 * Returns whether an instruction name is a memory declaration instruction.
 *
 * @param instruction - instruction value to use.
 * @returns The computed result.
 */
export function isMemoryDeclarationInstruction(instruction: string): instruction is MemoryDeclarationInstruction {
	return memoryDeclarationInstructions.has(instruction as MemoryDeclarationInstruction);
}

/**
 * Applies one semantic memory declaration line to the namespace context.
 *
 * Custom scalar handlers run before normal validation because they are used by
 * later namespace passes that revisit already allocated declarations. Non-scalar
 * declarations are ignored while a custom scalar handler is active.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function applyMemoryDeclarationLine(line: MemoryDeclarationLine, context: CompilationContext) {
	if (context.memoryDeclarationHandler) {
		if (isScalarMemoryDeclarationLine(line)) {
			return context.memoryDeclarationHandler(line, context);
		}
		return;
	}

	validateInstruction(line, context);
	const compileDeclaration = declarationCompilers[
		line.instruction as MemoryDeclarationInstruction
	] as MemoryDeclarationCompiler;
	return compileDeclaration(line, context);
}
