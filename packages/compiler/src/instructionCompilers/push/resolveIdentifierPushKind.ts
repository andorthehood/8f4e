import type { ArgumentIdentifier, LocalMap, Namespace } from '../../types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
	MEMORY_POINTER_END_ADDRESS,
	LOCAL_POINTER,
	LOCAL_POINTER_END_ADDRESS,
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

	if (
		identifier.referenceKind === 'pointee-memory-reference' &&
		identifier.targetMemoryId &&
		Object.hasOwn(memory, identifier.targetMemoryId)
	) {
		return IdentifierPushKind.MEMORY_POINTER_END_ADDRESS;
	}

	if (
		identifier.referenceKind === 'pointee-memory-reference' &&
		identifier.targetMemoryId &&
		Object.hasOwn(locals, identifier.targetMemoryId) &&
		!!locals[identifier.targetMemoryId]?.pointeeBaseType
	) {
		return IdentifierPushKind.LOCAL_POINTER_END_ADDRESS;
	}

	return IdentifierPushKind.LOCAL;
}
