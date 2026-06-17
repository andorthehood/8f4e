import type {
	CompilationContext,
	CompilerASTLine,
	InstructionCompiler,
	SemanticReferenceLine,
	SemanticReferenceLineFacts,
	StackAnalysisLineFacts,
} from '@8f4e/language-spec';
import type { Instruction } from './instructionCompilers';
import instructions from './instructionCompilers';

/**
 * Emits bytecode for one instruction line using semantic-reference and stack-analysis facts.
 *
 * @param sourceLine - AST line being processed.
 * @param semanticFacts - Semantic-reference facts keyed to the same AST line.
 * @param stackFacts - Stack-analysis facts keyed to the same AST line.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function compileCodegenLine(
	sourceLine: CompilerASTLine,
	semanticFacts: SemanticReferenceLineFacts | undefined,
	stackFacts: StackAnalysisLineFacts,
	context: CompilationContext
) {
	const line = { ...sourceLine, ...(semanticFacts ?? {}) } as SemanticReferenceLine;
	const instruction = line.instruction as Instruction;
	const compileInstruction = instructions[instruction] as InstructionCompiler;
	return compileInstruction(line, context, stackFacts);
}
