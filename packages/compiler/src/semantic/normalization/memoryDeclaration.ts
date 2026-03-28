import { validateIntermoduleAddressReference, normalizeArgumentsAtIndexes } from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';

/**
 * Normalizes compile-time arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Both the name argument (index 0) and the default value argument (index 1) are normalized.
 * Validates intermodule references in the default value if present.
 */
export default function normalizeMemoryDeclaration(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	const argument = normalized.arguments[1];
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.value, line, context);
	}

	return normalized;
}
