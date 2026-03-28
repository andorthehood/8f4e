import { validateIntermoduleAddressReference, normalizeArgumentsAtIndexes } from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';

/**
 * Normalizes compile-time arguments for the `init` instruction.
 * The default value argument (index 1) is normalized.
 * Validates intermodule references in the default value if present.
 */
export default function normalizeInit(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [1]);

	const argument = normalized.arguments[1];
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.value, line, context);
	}

	return normalized;
}
