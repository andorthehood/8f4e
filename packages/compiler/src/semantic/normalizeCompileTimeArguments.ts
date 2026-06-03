import type { CompilationContext, CompilerASTLine, NormalizedLine } from '@8f4e/compiler-spec';
import dispatchNormalization from './normalization';

/**
 * Dispatches compile-time argument normalization for one AST line.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function normalizeCompileTimeArguments<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
