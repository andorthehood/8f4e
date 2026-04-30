import type { ArgumentIdentifier, LocalMap, Namespace } from '@8f4e/compiler-types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
	LOCAL_POINTER,
	LOCAL,
}

export default function resolveIdentifierPushKind(
	namespace: Namespace,
	locals: LocalMap,
	identifier: ArgumentIdentifier
): IdentifierPushKind {
	const { memory } = namespace;

	// Locals shadow memory: if the identifier refers to a declared local, treat it as LOCAL.
	if (identifier.referenceKind === 'plain' && Object.hasOwn(locals, identifier.value)) {
		return IdentifierPushKind.LOCAL;
	}

	if (identifier.referenceKind === 'plain' && Object.hasOwn(memory, identifier.value)) {
		return IdentifierPushKind.MEMORY_IDENTIFIER;
	}

	if (
		identifier.referenceKind === 'memory-pointer' &&
		identifier.targetMemoryId &&
		Object.hasOwn(memory, identifier.targetMemoryId)
	) {
		return IdentifierPushKind.MEMORY_POINTER;
	}

	if (
		identifier.referenceKind === 'memory-pointer' &&
		identifier.targetMemoryId &&
		Object.hasOwn(locals, identifier.targetMemoryId) &&
		!!locals[identifier.targetMemoryId]?.pointeeBaseType
	) {
		return IdentifierPushKind.LOCAL_POINTER;
	}

	return IdentifierPushKind.LOCAL;
}
