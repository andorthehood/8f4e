import type { Namespace, ArgumentIdentifier, LocalMap } from '../../types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
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

	return IdentifierPushKind.LOCAL;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('resolveIdentifierPushKind', () => {
		it('resolves plain identifiers to LOCAL when they are in locals (locals shadow memory)', () => {
			const namespace = {
				memory: {
					buffer: {} as never,
				},
				consts: {
					ANSWER: { value: 42, isInteger: true },
				},
				moduleName: undefined,
				namespaces: {},
			} as Namespace;

			const locals = { buffer: { isInteger: true, index: 0 } };

			// Even though 'buffer' is in memory, it's in locals → LOCAL wins
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('buffer'))).toBe(IdentifierPushKind.LOCAL);
		});

		it('resolves plain identifiers to MEMORY_IDENTIFIER when only in memory (not in locals)', () => {
			const namespace = {
				memory: {
					buffer: {} as never,
				},
				consts: {},
				moduleName: undefined,
				namespaces: {},
			} as Namespace;

			const locals: LocalMap = {};

			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('buffer'))).toBe(
				IdentifierPushKind.MEMORY_IDENTIFIER
			);
		});

		it('resolves memory-pointer, address-ref, element-query, and unknown identifiers correctly', () => {
			const namespace = {
				memory: {
					buffer: {} as never,
				},
				consts: {
					ANSWER: { value: 42, isInteger: true },
				},
				moduleName: undefined,
				namespaces: {},
			} as Namespace;

			const locals: LocalMap = {};

			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('*buffer'))).toBe(
				IdentifierPushKind.MEMORY_POINTER
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('&buffer'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('count(buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('sizeof(buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('sizeof(*buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('max(buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('max(*buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('min(buffer)'))).toBe(
				IdentifierPushKind.LOCAL
			);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('ANSWER'))).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, locals, classifyIdentifier('localTemp'))).toBe(
				IdentifierPushKind.LOCAL
			);
		});
	});
}
