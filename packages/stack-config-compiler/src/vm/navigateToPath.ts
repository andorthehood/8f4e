import getArrayIndex from './getArrayIndex';
import isArrayIndex from './isArrayIndex';
import { isArrayAppendSlot } from './isArrayIndex';

/**
 * Navigates to a location in the config object, creating intermediate objects/arrays as needed
 * Returns the parent object and the final key for the target location
 */
export default function navigateToPath(
	config: Record<string, unknown>,
	segments: string[]
): { parent: Record<string, unknown> | unknown[]; key: string | number } | null {
	if (segments.length === 0) {
		return null;
	}

	let current: Record<string, unknown> | unknown[] = config;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const nextSegment = segments[i + 1];
		const isNextArray = isArrayIndex(nextSegment) || isArrayAppendSlot(nextSegment);

		if (isArrayAppendSlot(segment)) {
			// Append slot: create a new element in the current array
			const arr = current as unknown[];
			const newIndex = arr.length;
			arr[newIndex] = isNextArray ? [] : {};
			current = arr[newIndex] as Record<string, unknown> | unknown[];
		} else if (isArrayIndex(segment)) {
			const index = getArrayIndex(segment);
			const arr = current as unknown[];

			if (arr[index] === undefined) {
				arr[index] = isNextArray ? [] : {};
			}

			const next = arr[index];
			if (typeof next !== 'object' || next === null) {
				return null;
			}
			current = next as Record<string, unknown> | unknown[];
		} else {
			const obj = current as Record<string, unknown>;

			if (obj[segment] === undefined) {
				obj[segment] = isNextArray ? [] : {};
			}

			const next = obj[segment];
			if (typeof next !== 'object' || next === null) {
				return null;
			}
			current = next as Record<string, unknown> | unknown[];
		}
	}

	const lastSegment = segments[segments.length - 1];
	if (isArrayAppendSlot(lastSegment)) {
		// For append slot as the final segment, return the array itself with a special marker
		// The calling code will need to append to this array
		const arr = current as unknown[];
		return { parent: arr, key: arr.length };
	}
	if (isArrayIndex(lastSegment)) {
		return { parent: current, key: getArrayIndex(lastSegment) };
	}
	return { parent: current, key: lastSegment };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('navigateToPath', () => {
		it('should return null for empty segments', () => {
			expect(navigateToPath({}, [])).toBe(null);
		});

		it('should navigate single segment', () => {
			const config = {};
			const result = navigateToPath(config, ['name']);
			expect(result).toEqual({ parent: config, key: 'name' });
		});

		it('should create nested objects', () => {
			const config: Record<string, unknown> = {};
			navigateToPath(config, ['a', 'b', 'c']);
			expect(config).toEqual({ a: { b: {} } });
		});

		it('should navigate array index', () => {
			const config: Record<string, unknown> = { items: [] };
			const result = navigateToPath(config, ['items', '[0]']);
			expect(result).toEqual({ parent: config.items, key: 0 });
		});

		it('should create arrays when next segment is index', () => {
			const config: Record<string, unknown> = {};
			navigateToPath(config, ['items', '[0]', 'name']);
			expect(config).toEqual({ items: [{}] });
		});

		it('should return null when navigating through scalar', () => {
			const config = { name: 'test' };
			expect(navigateToPath(config, ['name', 'nested'])).toBe(null);
		});

		it('should handle append slot in array', () => {
			const config: Record<string, unknown> = { items: [1, 2] };
			const result = navigateToPath(config, ['items', '[]']);
			expect(result).toEqual({ parent: config.items, key: 2 });
		});

		it('should handle append slot with property', () => {
			const config: Record<string, unknown> = { items: [] };
			navigateToPath(config, ['items', '[]', 'name']);
			expect(config).toEqual({ items: [{}] });
		});

		it('should handle multiple append slots', () => {
			const config: Record<string, unknown> = { items: [] };
			navigateToPath(config, ['items', '[]', 'nested', '[]', 'value']);
			expect(config).toEqual({ items: [{ nested: [{}] }] });
		});
	});
}
