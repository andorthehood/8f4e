import { normalizeArgumentsAtIndexes, validateOrDeferCompileTimeExpression } from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';

/**
 * Normalizes compile-time arguments for the `const` instruction.
 * Folds the value argument (index 1) if it resolves to a compile-time constant.
 */
export default function normalizeConst(line: AST[number], context: CompilationContext): AST[number] {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);

	const valueArg = result.arguments[1];
	if (valueArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(valueArg, line, context);
		if (deferred) {
			return result;
		}
	}

	return result;
}
