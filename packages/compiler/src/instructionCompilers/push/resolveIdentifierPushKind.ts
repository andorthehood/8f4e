import {
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
} from '../../utils/memoryIdentifier';

import type { Namespace } from '../../types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
	MEMORY_REFERENCE,
	LOCAL,
}

export default function resolveIdentifierPushKind(namespace: Namespace, value: string): IdentifierPushKind {
	const { memory } = namespace;

	switch (true) {
		case isMemoryIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_IDENTIFIER;
		case isMemoryPointerIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_POINTER;
		case isMemoryReferenceIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_REFERENCE;
		default:
			return IdentifierPushKind.LOCAL;
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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

			expect(resolveIdentifierPushKind(namespace, 'buffer')).toBe(IdentifierPushKind.MEMORY_IDENTIFIER);
			expect(resolveIdentifierPushKind(namespace, '*buffer')).toBe(IdentifierPushKind.MEMORY_POINTER);
			expect(resolveIdentifierPushKind(namespace, '&buffer')).toBe(IdentifierPushKind.MEMORY_REFERENCE);
			expect(resolveIdentifierPushKind(namespace, 'count(buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'sizeof(buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'sizeof(*buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'max(buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'max(*buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'min(buffer)')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'ANSWER')).toBe(IdentifierPushKind.LOCAL);
			expect(resolveIdentifierPushKind(namespace, 'localTemp')).toBe(IdentifierPushKind.LOCAL);
		});
	});
}
