import type {
	AnalyzedLine,
	CompilationContext,
	CompilerASTLine,
	InstructionCompiler,
	ResolvedCallLine,
} from '@8f4e/compiler-spec';
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

/**
 * Attaches stack-analysis facts from the project stack report to a codegen-normalized line.
 *
 * @param line - AST line being processed.
 * @param analyzedLine - Matching stack-analyzed report line.
 * @returns The computed result.
 */
export function attachStackAnalysis(line: CompilerASTLine, analyzedLine: AnalyzedLine): AnalyzedLine {
	return {
		...line,
		...(analyzedLine.instruction === 'call'
			? { targetFunction: (analyzedLine as AnalyzedLine<ResolvedCallLine>).targetFunction }
			: {}),
		stackAnalysis: analyzedLine.stackAnalysis,
	} as AnalyzedLine;
}
