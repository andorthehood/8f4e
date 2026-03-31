import {
	normalizeArgumentsAtIndexes,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
} from './helpers';

import { ArgumentType, type CompilationContext, type ConstLine, type NormalizedConstLine } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `const` instruction.
 *
 * This is the single validation entry point for const declarations, shared by both the
 * namespace prepass (collectNamespacesFromASTs → prepassNamespace) and module/function
 * compilation (compileModule / compileFunction → compileLine → applySemanticLine).
 *
 * It folds the value argument (index 1) against the current namespace consts. If the value
 * still cannot be reduced to a literal after folding, it throws UNDECLARED_IDENTIFIER.
 * During namespace prepass, that error is caught by collectNamespacesFromASTs, which defers
 * the entire AST for re-processing once more namespaces are available. This ensures that
 * const declarations referencing other modules' consts are validated and resolved in
 * dependency order.
 *
 * Declaration order within a single module is significant: a const may only reference
 * identifiers that have already been declared (earlier const lines or values imported via
 * a preceding `use` instruction). Forward references will throw UNDECLARED_IDENTIFIER.
 */
export default function normalizeConst(line: ConstLine, context: CompilationContext): NormalizedConstLine | ConstLine {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);

	const valueArg = result.arguments[1];
	if (valueArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(valueArg, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${valueArg.left.value}${valueArg.operator}${valueArg.right.value}`,
			});
		}
	}
	if (valueArg?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(valueArg, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: valueArg.value });
		}
	}

	return result as NormalizedConstLine;
}
