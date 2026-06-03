import type { CompilationContext, MapLine, NormalizedArgumentLiteral, NormalizedMapLine } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { peekMapBlock } from '../../utils/blockStack';
import { normalizeAndValidateResolvableArgs } from './helpers';

/** Creates the implicit key argument for one-argument `map` rows from the active map state. */
function createImplicitKeyArgument(context: CompilationContext): NormalizedArgumentLiteral {
	const { mapState } = peekMapBlock(context);

	return {
		type: ArgumentType.LITERAL,
		value: mapState.rows.length,
		isInteger: mapState.inputIsInteger,
		...(mapState.inputIsFloat64 ? { isFloat64: true } : {}),
	};
}

/**
 * Normalizes compile-time arguments for the `map` instruction.
 * Two-argument rows normalize both key and value. One-argument rows use the
 * current zero-based map row count as the implicit key and normalize the lone
 * argument as the value.
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
