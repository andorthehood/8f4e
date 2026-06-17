import type { CompilationContext, MapLine, ResolvedArgumentLiteral, ResolvedMapLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { resolveAndValidateValueArguments } from './helpers';

/** Creates the implicit key argument for one-argument `map` rows from the active map state. */
function createImplicitKeyArgument(context: CompilationContext): ResolvedArgumentLiteral {
	const { mapState } = context.activeMapBlock!;

	return {
		type: ArgumentType.LITERAL,
		value: mapState.rows.length,
		isInteger: mapState.inputIsInteger,
		...(mapState.inputIsFloat64 ? { isFloat64: true } : {}),
	};
}

/**
 * Resolves value arguments for the `map` instruction.
 * Two-argument rows resolve both key and value. One-argument rows use the
 * current zero-based map row count as the implicit key and resolve the lone
 * argument as the value.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Map line with resolved key/value arguments.
 */
export default function resolveMapReferences(line: MapLine, context: CompilationContext): ResolvedMapLine {
	if (line.arguments.length === 1) {
		const resolved = resolveAndValidateValueArguments(line, context, [0]);

		return {
			...resolved,
			arguments: [createImplicitKeyArgument(context), resolved.arguments[0]],
		} as ResolvedMapLine;
	}

	const resolved = resolveAndValidateValueArguments(line, context, [0, 1]);

	return resolved as ResolvedMapLine;
}
