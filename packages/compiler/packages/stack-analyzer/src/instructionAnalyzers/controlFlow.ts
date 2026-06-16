import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { cloneStack, consume } from './stack';
import type { InstructionAnalysisResult } from './types';

/**
 * Consumes an exit condition and marks the remaining stack as dropped for the conditional branch.
 *
 * @param _line - Compiler line kept for the shared analyzer signature.
 * @param context - Compilation context used by the operation.
 * @returns The stack-analysis result for the instruction.
 */
export function analyzeExitIfTrue(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 1);
	return { consumed, produced: [], dropped: cloneStack(context.stack) };
}
