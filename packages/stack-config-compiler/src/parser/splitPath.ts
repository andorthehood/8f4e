import { splitPathSegments } from '../utils';

/**
 * Splits a path string into segments with error checking
 * Examples: "foo.bar" -> ["foo", "bar"]
 *           "foo[0].bar" -> ["foo", "[0]", "bar"]
 */
export default function splitPath(path: string): string[] | { error: string } {
	const openBrackets = (path.match(/\[/g) || []).length;
	const closeBrackets = (path.match(/\]/g) || []).length;
	if (openBrackets !== closeBrackets) {
		return { error: `Malformed path: unclosed bracket in "${path}"` };
	}

	return splitPathSegments(path);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('splitPath', () => {
		it('should split simple path', () => {
			expect(splitPath('foo.bar')).toEqual(['foo', 'bar']);
		});

		it('should split path with array index', () => {
			expect(splitPath('foo[0].bar')).toEqual(['foo', '[0]', 'bar']);
		});

		it('should split nested path', () => {
			expect(splitPath('a.b.c.d')).toEqual(['a', 'b', 'c', 'd']);
		});

		it('should handle single segment', () => {
			expect(splitPath('name')).toEqual(['name']);
		});

		it('should return error for unclosed bracket', () => {
			expect(splitPath('foo[0')).toEqual({ error: 'Malformed path: unclosed bracket in "foo[0"' });
		});

		it('should return error for extra closing bracket', () => {
			expect(splitPath('foo]0')).toEqual({ error: 'Malformed path: unclosed bracket in "foo]0"' });
		});

		it('should handle multiple array indices', () => {
			expect(splitPath('a[0][1]')).toEqual(['a', '[0]', '[1]']);
		});

		it('should handle empty brackets (append slot)', () => {
			expect(splitPath('items[]')).toEqual(['items', '[]']);
		});

		it('should handle append slot with property', () => {
			expect(splitPath('items[].name')).toEqual(['items', '[]', 'name']);
		});
	});
}
