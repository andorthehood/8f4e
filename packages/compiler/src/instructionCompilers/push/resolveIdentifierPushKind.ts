import type { ArgumentIdentifier, LocalMap, Namespace } from '@8f4e/compiler-spec';

export const IdentifierPushKind = {
	MEMORY_IDENTIFIER: 0,
	MEMORY_POINTER: 1,
	LOCAL_POINTER: 2,
	LOCAL: 3,
} as const;

// eslint-disable-next-line no-redeclare
export type IdentifierPushKind = (typeof IdentifierPushKind)[keyof typeof IdentifierPushKind];

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
