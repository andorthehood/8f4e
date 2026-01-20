/**
 * Shared utilities for the stack config compiler
 */

/** Regex to split path into segments (handles dot notation, array indices, and append slots) */
export const PATH_SEGMENT_REGEX = /([^.[\]]+|\[\d*\])/g;

/**
 * Splits a path string into segments
 * Examples: "foo.bar" -> ["foo", "bar"]
 *           "foo[0].bar" -> ["foo", "[0]", "bar"]
 *           "foo[].bar" -> ["foo", "[]", "bar"]
 */
export function splitPathSegments(path: string): string[] {
	const segments = path.match(PATH_SEGMENT_REGEX) || [];
	return segments.filter(s => s.length > 0);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('splitPathSegments', () => {
		it('should split simple path', () => {
			expect(splitPathSegments('foo.bar')).toEqual(['foo', 'bar']);
		});

		it('should split path with array index', () => {
			expect(splitPathSegments('foo[0].bar')).toEqual(['foo', '[0]', 'bar']);
		});

		it('should handle empty string', () => {
			expect(splitPathSegments('')).toEqual([]);
		});

		it('should handle single segment', () => {
			expect(splitPathSegments('name')).toEqual(['name']);
		});

		it('should handle multiple array indices', () => {
			expect(splitPathSegments('a[0][1]')).toEqual(['a', '[0]', '[1]']);
		});

		it('should handle deeply nested path', () => {
			expect(splitPathSegments('a.b.c.d')).toEqual(['a', 'b', 'c', 'd']);
		});

		it('should handle empty brackets (append slot)', () => {
			expect(splitPathSegments('items[]')).toEqual(['items', '[]']);
		});

		it('should handle append slot with property', () => {
			expect(splitPathSegments('items[].name')).toEqual(['items', '[]', 'name']);
		});

		it('should handle multiple append slots', () => {
			expect(splitPathSegments('a[][].b')).toEqual(['a', '[]', '[]', 'b']);
		});
	});
}
