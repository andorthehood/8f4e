import { isPlainObject } from '../isPlainObject';

/**
 * Deep merges two config objects. Later values override earlier values.
 * Arrays are replaced entirely, not merged.
 */
export function deepMergeConfig(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };

	for (const key of Object.keys(source)) {
		const sourceValue = source[key];
		const targetValue = result[key];

		if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
			result[key] = deepMergeConfig(targetValue, sourceValue);
		} else {
			result[key] = sourceValue;
		}
	}

	return result;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('deepMergeConfig', () => {
		it('should merge flat objects', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ a: 1, b: 3, c: 4 });
		});

		it('should deep merge nested objects', () => {
			const target = { nested: { a: 1, b: 2 } };
			const source = { nested: { b: 3, c: 4 } };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
		});

		it('should replace arrays entirely', () => {
			const target = { items: [1, 2, 3] };
			const source = { items: [4, 5] };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ items: [4, 5] });
		});

		it('should not mutate the original objects', () => {
			const target = { a: 1 };
			const source = { b: 2 };
			const result = deepMergeConfig(target, source);
			expect(target).toEqual({ a: 1 });
			expect(source).toEqual({ b: 2 });
			expect(result).toEqual({ a: 1, b: 2 });
		});

		it('should handle projectInfo-like structure', () => {
			const target = { projectInfo: { title: 'Title', author: 'Author' } };
			const source = { projectInfo: { description: 'Description' } };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({
				projectInfo: { title: 'Title', author: 'Author', description: 'Description' },
			});
		});
	});
}
