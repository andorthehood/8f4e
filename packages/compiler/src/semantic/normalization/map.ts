import { normalizeAndValidateResolvableArgs } from './helpers';

import type { CompilationContext, MapLine, NormalizedMapLine } from '@8f4e/compiler-spec';

/**
 * Normalizes compile-time arguments for the `map` instruction.
 * Both the key argument (index 0) and value argument (index 1) are normalized.
 * Throws UNDECLARED_IDENTIFIER if either remains as an unresolved identifier after normalization.
 */
export default function normalizeMap(line: MapLine, context: CompilationContext): NormalizedMapLine | MapLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0, 1]);

	return normalized as NormalizedMapLine | MapLine;
}
