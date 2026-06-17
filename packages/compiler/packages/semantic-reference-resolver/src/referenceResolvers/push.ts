import {
	ArgumentType,
	type CompilationContext,
	ErrorCode,
	getError,
	type MemoryPointerIdentifier,
	type PointerLocalBinding,
	type PushLine,
	type ResolvedLocalPointerPushLine,
	type ResolvedLocalPushLine,
	type ResolvedMemoryPointerPushLine,
	type ResolvedMemoryPushLine,
	type SemanticPushLine,
} from '@8f4e/language-spec';
import { getResolvedMemoryDeclaration } from '@8f4e/semantic-utils';
import {
	resolveArgumentsAtIndexes,
	validateIntermoduleAddressReference,
	validateUnresolvedValueExpression,
} from './helpers';

function isResolvedPointerLocal(local: CompilationContext['locals'][string] | undefined): local is PointerLocalBinding {
	return !!local?.pointeeBaseType;
}

function getDeclaredPointerDepth(pointerMetadata: { pointerDepth: number; pointeeBaseType?: unknown }): number {
	return pointerMetadata.pointeeBaseType ? pointerMetadata.pointerDepth : 0;
}

function validateDereferenceDepth(
	pointerArgument: MemoryPointerIdentifier,
	pointerMetadata: { pointerDepth: number; pointeeBaseType?: unknown },
	line: PushLine,
	context: CompilationContext
): void {
	if (pointerArgument.dereferenceDepth > getDeclaredPointerDepth(pointerMetadata)) {
		throw getError(ErrorCode.POINTER_DEREFERENCE_DEPTH_EXCEEDED, line, context, {
			identifier: pointerArgument.value,
		});
	}
}

function throwIfPointeeCountIsUnknown(line: PushLine, context: CompilationContext): void {
	const argument = line.arguments[0];
	if (argument?.type !== ArgumentType.IDENTIFIER || argument.referenceKind !== 'pointee-element-count') {
		return;
	}

	const base = argument.targetMemoryId;
	const pointerMetadata = getResolvedMemoryDeclaration(context, base) ?? context.locals[base];
	if (pointerMetadata?.pointeeBaseType && pointerMetadata.pointeeElementCount === undefined) {
		throw getError(ErrorCode.POINTEE_ELEMENT_COUNT_UNKNOWN, line, context, { identifier: argument.value });
	}
}

/**
 * Resolves value arguments for the `push` instruction.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Push line with resolved target metadata where needed.
 */
export default function resolvePushReferences(line: PushLine, context: CompilationContext): SemanticPushLine {
	const { line: resolved } = resolveArgumentsAtIndexes(line, context, [0]);
	const resolvedPushLine = resolved as PushLine;

	throwIfPointeeCountIsUnknown(resolvedPushLine, context);

	const argument = resolved.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		validateUnresolvedValueExpression(argument, line, context);
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value, referenceKind } = argument;
		validateIntermoduleAddressReference(argument, line, context);
		if (referenceKind === 'plain') {
			const local = context.locals[value];
			if (local) {
				const resolvedLine: Omit<ResolvedLocalPushLine, 'resolvedTarget'> = {
					...resolvedPushLine,
					arguments: [argument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'local' as const, localName: value } };
			}

			const memoryItem = getResolvedMemoryDeclaration(context, value);
			if (memoryItem) {
				const resolvedLine: Omit<ResolvedMemoryPushLine, 'resolvedTarget'> = {
					...resolvedPushLine,
					arguments: [argument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'memory' as const, memoryItem } };
			}
		}
		if (referenceKind === 'memory-pointer') {
			const pointerArgument = argument as MemoryPointerIdentifier;
			const memoryItem = getResolvedMemoryDeclaration(context, pointerArgument.targetMemoryId);
			if (memoryItem) {
				validateDereferenceDepth(pointerArgument, memoryItem, line, context);
				const resolvedLine: Omit<ResolvedMemoryPointerPushLine, 'resolvedTarget'> = {
					...resolvedPushLine,
					arguments: [pointerArgument],
				};
				return { ...resolvedLine, resolvedTarget: { kind: 'memory-pointer' as const, memoryItem } };
			}

			const local = context.locals[pointerArgument.targetMemoryId];
			if (isResolvedPointerLocal(local)) {
				validateDereferenceDepth(pointerArgument, local, line, context);
				const resolvedLine: Omit<ResolvedLocalPointerPushLine, 'resolvedTarget'> = {
					...resolvedPushLine,
					arguments: [pointerArgument],
				};
				return {
					...resolvedLine,
					resolvedTarget: { kind: 'local-pointer' as const, localName: pointerArgument.targetMemoryId },
				};
			}
		}

		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
	}

	return resolved as SemanticPushLine;
}
