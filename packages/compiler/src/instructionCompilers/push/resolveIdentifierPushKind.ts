import type { Namespace, ArgumentIdentifier } from '../../types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
	LOCAL,
}

export default function resolveIdentifierPushKind(
	namespace: Namespace,
	identifier: ArgumentIdentifier
): IdentifierPushKind {
	const { memory } = namespace;

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

	return IdentifierPushKind.LOCAL;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('resolveIdentifierPushKind', () => {
		it('resolves memory identifiers before local fallback', () => {
			const namespace = {
				memory: {
					buffer: {} as never,
				},
				consts: {
					ANSWER: { value: 42, isInteger: true },
				},
				locals: {},
				moduleName: undefined,
				namespaces: {},
			} as Namespace;

			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('buffer'))).toBe(
				IdentifierPushKind.MEMORY_IDENTIFIER
			);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('*buffer'))).toBe(
				IdentifierPushKind.MEMORY_POINTER
			);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('&buffer'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('count(buffer)'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('sizeof(buffer)'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('sizeof(*buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('max(buffer)'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('max(*buffer)'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('min(buffer)'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('ANSWER'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, classifyIdentifier('localTemp'))).toBe(IdentifierPushKind.LOCAL);
		});
	});
}
