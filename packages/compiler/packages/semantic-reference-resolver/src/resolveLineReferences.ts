import type { CompilationContext, CompilerASTLine, SemanticReferenceLine } from '@8f4e/language-spec';
import resolveInstructionReferences from './referenceResolvers';

/**
 * Resolves semantic value arguments for one AST line.
 * This folds memory/layout expressions in instruction-specific value positions.
 * Constant identifiers are expected to have been inlined before semantic reference resolution.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function resolveLineReferences<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): SemanticReferenceLine<TLine> {
	return resolveInstructionReferences(line, context);
}
