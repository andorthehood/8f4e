import type { AnalyzedLine, CompilationContext, InstructionCompiler } from '@8f4e/language-spec';
import type { Instruction } from './instructionCompilers';
import instructions from './instructionCompilers';

/**
 * Emits bytecode for one already-analyzed instruction line.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function compileCodegenLine(line: AnalyzedLine, context: CompilationContext) {
	const instruction = line.instruction as Instruction;
	const compileInstruction = instructions[instruction] as InstructionCompiler;
	compileInstruction(line, context);
}
