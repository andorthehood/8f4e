import {
	hasCollectedNamespaces,
	isMemoryIdentifier,
	isIntermoduleReferenceKind,
	type PublicMemoryLayoutContext,
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from '@8f4e/compiler-memory-layout';

import { ArgumentType, type CompilationContext, type CodegenPushLine, type PushLine } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `push` instruction.
 * The value argument (index 0) is normalized.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 */
export default function normalizePush(line: PushLine, context: CompilationContext): CodegenPushLine {
	const publicMemoryContext = context as unknown as PublicMemoryLayoutContext;
	const { line: normalized } = normalizeArgumentsAtIndexes(line, publicMemoryContext, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, publicMemoryContext);
		if (deferred) {
			return normalized as CodegenPushLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value, referenceKind } = argument;
		const { memory } = context.namespace;
		const isIntermodule = isIntermoduleReferenceKind(referenceKind);
		if (!hasCollectedNamespaces(publicMemoryContext) && isIntermodule) {
			return normalized as CodegenPushLine;
		}
		// Validate intermodule references first
		validateIntermoduleAddressReference(argument, line, publicMemoryContext);
		if (isIntermodule) {
			return normalized as CodegenPushLine;
		}
		if (
			!(referenceKind === 'plain' && isMemoryIdentifier(memory, value)) &&
			!(referenceKind === 'memory-pointer' && isMemoryIdentifier(memory, argument.targetMemoryId)) &&
			!context.locals[value]
		) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
		}
	}

	return normalized as CodegenPushLine;
}
