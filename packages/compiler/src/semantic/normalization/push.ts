import {
	hasCollectedNamespaces,
	isIntermoduleReferenceKind,
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type CompilationContext, type CodegenPushLine, type PushLine } from '../../types';
import { isMemoryIdentifier } from '../../utils/memoryIdentifier';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `push` instruction.
 * The value argument (index 0) is normalized.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 */
export default function normalizePush(line: PushLine, context: CompilationContext): CodegenPushLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized as CodegenPushLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value, referenceKind } = argument;
		const { memory } = context.namespace;
		const isIntermodule = isIntermoduleReferenceKind(referenceKind);
		if (!hasCollectedNamespaces(context) && isIntermodule) {
			return normalized as CodegenPushLine;
		}
		// Validate intermodule references first
		validateIntermoduleAddressReference(argument, line, context);
		if (isIntermodule) {
			return normalized as CodegenPushLine;
		}
		// *name& — pointee end-address: validate that the target is a pointer type
		if (referenceKind === 'pointee-memory-reference') {
			const targetId = argument.targetMemoryId;
			const memoryItem = memory[targetId];
			const localItem = context.locals[targetId];
			if (!memoryItem && !localItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetId });
			}
			const isPointer = memoryItem ? !!memoryItem.pointeeBaseType : !!localItem?.pointeeBaseType;
			if (!isPointer) {
				throw getError(ErrorCode.POINTEE_END_ADDRESS_ON_NON_POINTER, line, context, { identifier: targetId });
			}
			return normalized as CodegenPushLine;
		}
		if (
			!(referenceKind === 'plain' && isMemoryIdentifier(memory, value)) &&
			!(referenceKind === 'memory-pointer' && isMemoryIdentifier(memory, argument.targetMemoryId)) &&
			!(referenceKind === 'memory-pointer' && !!context.locals[argument.targetMemoryId]?.pointeeBaseType) &&
			!context.locals[value]
		) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
		}
	}

	return normalized as CodegenPushLine;
}
