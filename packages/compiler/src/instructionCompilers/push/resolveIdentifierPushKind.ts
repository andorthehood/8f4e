import {
	isElementCountIdentifier,
	isElementMaxIdentifier,
	isElementMinIdentifier,
	isElementWordSizeIdentifier,
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
} from '../../utils/memoryIdentifier';
import { isConstantValueOrExpression } from '../../utils/resolveConstantValue';

import type { Namespace } from '../../types';

export const enum IdentifierPushKind {
	MEMORY_IDENTIFIER,
	MEMORY_POINTER,
	MEMORY_REFERENCE,
	ELEMENT_COUNT,
	ELEMENT_WORD_SIZE,
	ELEMENT_MAX,
	ELEMENT_MIN,
	CONST,
	LOCAL,
}

export default function resolveIdentifierPushKind(namespace: Namespace, value: string): IdentifierPushKind {
	const { memory, consts } = namespace;

	switch (true) {
		case isMemoryIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_IDENTIFIER;
		case isMemoryPointerIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_POINTER;
		case isMemoryReferenceIdentifier(memory, value):
			return IdentifierPushKind.MEMORY_REFERENCE;
		case isElementCountIdentifier(memory, value):
			return IdentifierPushKind.ELEMENT_COUNT;
		case isElementWordSizeIdentifier(memory, value):
			return IdentifierPushKind.ELEMENT_WORD_SIZE;
		case isElementMaxIdentifier(memory, value):
			return IdentifierPushKind.ELEMENT_MAX;
		case isElementMinIdentifier(memory, value):
			return IdentifierPushKind.ELEMENT_MIN;
		case isConstantValueOrExpression(consts, value):
			return IdentifierPushKind.CONST;
		default:
			return IdentifierPushKind.LOCAL;
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resolveIdentifierPushKind', () => {
		it('resolves prefixed memory identifiers before const/local fallback', () => {
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
			expect(resolveIdentifierPushKind(namespace, '$buffer')).toBe(IdentifierPushKind.ELEMENT_COUNT);
			expect(resolveIdentifierPushKind(namespace, '%buffer')).toBe(IdentifierPushKind.ELEMENT_WORD_SIZE);
			expect(resolveIdentifierPushKind(namespace, '^buffer')).toBe(IdentifierPushKind.ELEMENT_MAX);
			expect(resolveIdentifierPushKind(namespace, '!buffer')).toBe(IdentifierPushKind.ELEMENT_MIN);
			expect(resolveIdentifierPushKind(namespace, 'ANSWER')).toBe(IdentifierPushKind.CONST);
			expect(resolveIdentifierPushKind(namespace, 'localTemp')).toBe(IdentifierPushKind.LOCAL);
		});
	});
}
