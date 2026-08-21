import type { CompilationContext, DefaultLine, ResolvedDefaultLine } from '@8f4e/language-spec';
import { resolveAndValidateValueArguments } from './helpers';

/**
 * Resolves value arguments for the `default` instruction.
 * Throws UNDECLARED_IDENTIFIER if the value argument remains unresolved.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Default line with resolved value arguments.
 */
export default function resolveDefaultReferences(
	line: DefaultLine,
	context: CompilationContext
): ResolvedDefaultLine | DefaultLine {
	const resolved = resolveAndValidateValueArguments(line, context, [0]);

	return resolved as ResolvedDefaultLine | DefaultLine;
}
