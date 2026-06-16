import type { CompilationContext, MapLine, NormalizedArgumentLiteral, NormalizedMapLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { normalizeAndValidateResolvableArgs } from './helpers';

/** Creates the implicit key argument for one-argument `map` rows from the active map state. */
function createImplicitKeyArgument(context: CompilationContext): NormalizedArgumentLiteral {
	const { mapState } = context.activeMapBlock!;

	return {
		type: ArgumentType.LITERAL,
		value: mapState.rows.length,
		isInteger: mapState.inputIsInteger,
		...(mapState.inputIsFloat64 ? { isFloat64: true } : {}),
	};
}

/**
 * Normalizes value arguments for the `map` instruction.
 * Two-argument rows normalize both key and value. One-argument rows use the
 * current zero-based map row count as the implicit key and normalize the lone
 * argument as the value.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized map line.
 */
export default function normalizeMap(line: MapLine, context: CompilationContext): NormalizedMapLine {
	if (line.arguments.length === 1) {
		const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

		return {
			...normalized,
			arguments: [createImplicitKeyArgument(context), normalized.arguments[0]],
		} as NormalizedMapLine;
	}

	const normalized = normalizeAndValidateResolvableArgs(line, context, [0, 1]);

	return normalized as NormalizedMapLine;
}
