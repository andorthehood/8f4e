import {
	ArgumentType,
	type CompilationContext,
	type LocalBinding,
	type MemoryPointerIdentifier,
	type NormalizedPushLine,
	type PushLine,
	type ResolvedLocalPointerPushLine,
	type ResolvedLocalPushLine,
	type ResolvedMemoryPointerPushLine,
	type ResolvedMemoryPushLine,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import {
	hasCollectedNamespaces,
	isIntermoduleReferenceKind,
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { getError } from '../../compilerError';
import { getDataStructure } from '../../utils/memoryData';

function isResolvedPointerLocal(
	local: LocalBinding | undefined
): local is ResolvedLocalPointerPushLine['resolvedTarget']['local'] {
	return !!local?.pointeeBaseType;
}

/**
 * Normalizes compile-time arguments for the `push` instruction.
 * The value argument (index 0) is normalized.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 */
export default function normalizePush(line: PushLine, context: CompilationContext): NormalizedPushLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);
	const normalizedPushLine = normalized as PushLine;

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized as NormalizedPushLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value, referenceKind } = argument;
		const { memory } = context.namespace;
		const isIntermodule = isIntermoduleReferenceKind(referenceKind);
		if (!hasCollectedNamespaces(context) && isIntermodule) {
			return normalized as NormalizedPushLine;
		}
		// Validate intermodule references first
		validateIntermoduleAddressReference(argument, line, context);
		if (isIntermodule) {
			return normalized as NormalizedPushLine;
		}
		if (referenceKind === 'plain') {
			const local = context.locals[value];
			if (local) {
				const resolvedLine: Omit<ResolvedLocalPushLine, 'resolvedTarget'> = {
					...normalizedPushLine,
					arguments: [argument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'local' as const, local } };
			}

			const memoryItem = getDataStructure(memory, value);
			if (memoryItem) {
				const resolvedLine: Omit<ResolvedMemoryPushLine, 'resolvedTarget'> = {
					...normalizedPushLine,
					arguments: [argument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'memory' as const, memoryItem } };
			}
		}
		if (referenceKind === 'memory-pointer') {
			const pointerArgument = argument as MemoryPointerIdentifier;
			const memoryItem = getDataStructure(memory, pointerArgument.targetMemoryId);
			if (memoryItem) {
				const resolvedLine: Omit<ResolvedMemoryPointerPushLine, 'resolvedTarget'> = {
					...normalizedPushLine,
					arguments: [pointerArgument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'memory-pointer' as const, memoryItem } };
			}

			const local = context.locals[pointerArgument.targetMemoryId];
			if (isResolvedPointerLocal(local)) {
				const resolvedLine: Omit<ResolvedLocalPointerPushLine, 'resolvedTarget'> = {
					...normalizedPushLine,
					arguments: [pointerArgument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'local-pointer' as const, local } };
			}
		}

		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
	}

	return normalized as NormalizedPushLine;
}
