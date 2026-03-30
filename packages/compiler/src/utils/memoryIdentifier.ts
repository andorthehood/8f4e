import type { MemoryMap, ArgumentIdentifier } from '../types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}

export function resolveIdentifierMemoryKind(
	memoryMap: MemoryMap,
	identifier: ArgumentIdentifier
): 'memory' | 'pointer' | 'reference' | 'local' {
	if (identifier.referenceKind === 'memory-pointer' && Object.hasOwn(memoryMap, identifier.targetMemoryId!)) {
		return 'pointer';
	}
	if (identifier.referenceKind === 'memory-reference' && Object.hasOwn(memoryMap, identifier.targetMemoryId!)) {
		return 'reference';
	}
	if (identifier.referenceKind === 'plain' && Object.hasOwn(memoryMap, identifier.value)) {
		return 'memory';
	}
	return 'local';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('memoryIdentifier utilities', () => {
		const mockMemory: MemoryMap = {
			foo: {} as unknown as MemoryMap[string],
			bar: {} as unknown as MemoryMap[string],
		};

		describe('isMemoryIdentifier', () => {
			it('returns true for existing memory identifiers', () => {
				expect(isMemoryIdentifier(mockMemory, 'foo')).toBe(true);
				expect(isMemoryIdentifier(mockMemory, 'bar')).toBe(true);
			});

			it('returns false for non-existing memory identifiers', () => {
				expect(isMemoryIdentifier(mockMemory, 'baz')).toBe(false);
				expect(isMemoryIdentifier(mockMemory, '')).toBe(false);
			});
		});

		describe('resolveIdentifierMemoryKind', () => {
			it('resolves plain memory identifier', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('foo'))).toBe('memory');
			});

			it('resolves memory-reference (& prefix)', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('&foo'))).toBe('reference');
			});

			it('resolves memory-reference (& suffix)', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('foo&'))).toBe('reference');
			});

			it('resolves memory-pointer (* prefix)', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('*foo'))).toBe('pointer');
			});

			it('falls through to local for element queries', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('count(foo)'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('sizeof(foo)'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('max(foo)'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('min(foo)'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('sizeof(*foo)'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('max(*foo)'))).toBe('local');
			});

			it('falls through to local for constants and unknown identifiers', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('ANSWER'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('localTemp'))).toBe('local');
			});

			it('falls through to local when target memory does not exist', () => {
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('baz'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('&baz'))).toBe('local');
				expect(resolveIdentifierMemoryKind(mockMemory, classifyIdentifier('*baz'))).toBe('local');
			});
		});
	});
}
