import type { CompilationContext, CompilerASTLine, NormalizedLine } from '@8f4e/compiler-spec';
import dispatchNormalization from './normalization';

/**
 * Dispatches semantic value argument normalization for one AST line.
 * This folds memory/layout expressions in instruction-specific value positions.
 * Constant identifiers are expected to have been inlined before semantic normalization.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function normalizeValueArguments<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
