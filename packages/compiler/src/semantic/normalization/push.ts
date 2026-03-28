import {
	hasCollectedNamespaces,
	isIntermoduleReferenceLike,
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';
import {
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
} from '../../utils/memoryIdentifier';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `push` instruction.
 * The value argument (index 0) is normalized.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 */
export default function normalizePush(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value } = argument;
		const { memory } = context.namespace;
		const isIntermodule = isIntermoduleReferenceLike(value);
		if (!hasCollectedNamespaces(context) && isIntermodule) {
			return normalized;
		}
		// Validate intermodule references first
		validateIntermoduleAddressReference(value, line, context);
		if (isIntermodule) {
			return normalized;
		}
		if (
			!isMemoryIdentifier(memory, value) &&
			!isMemoryPointerIdentifier(memory, value) &&
			!isMemoryReferenceIdentifier(memory, value) &&
			!context.locals[value]
		) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
		}
	}

	return normalized;
}
