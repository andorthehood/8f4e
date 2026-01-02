import isPlainObject from '../isPlainObject';

/**
 * Deep merges two config objects. Later values override earlier values.
 * Arrays of plain objects are merged by index; other arrays are replaced.
 */

function cloneConfigValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(item => cloneConfigValue(item));
	}

	if (isPlainObject(value)) {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			result[key] = cloneConfigValue(value[key]);
		}
		return result;
	}

	return value;
}

function isArrayOfPlainObjects(value: unknown): value is Record<string, unknown>[] {
	return Array.isArray(value) && value.every(item => item === undefined || isPlainObject(item));
}

function mergeArrayOfPlainObjects(
	target: Record<string, unknown>[],
	source: Record<string, unknown>[]
): Record<string, unknown>[] {
	const maxLength = Math.max(target.length, source.length);
	const merged: Record<string, unknown>[] = [];

	for (let i = 0; i < maxLength; i += 1) {
		const targetItem = target[i];
		const sourceItem = source[i];

		if (targetItem && sourceItem) {
			merged[i] = deepMergeConfig(targetItem, sourceItem);
		} else if (sourceItem) {
			merged[i] = cloneConfigValue(sourceItem) as Record<string, unknown>;
		} else if (targetItem) {
			merged[i] = cloneConfigValue(targetItem) as Record<string, unknown>;
		}
	}

	return merged;
}

export default function deepMergeConfig(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };

	for (const key of Object.keys(source)) {
		const sourceValue = source[key];
		const targetValue = result[key];

		if (isArrayOfPlainObjects(sourceValue) && Array.isArray(targetValue) && isArrayOfPlainObjects(targetValue)) {
			result[key] = mergeArrayOfPlainObjects(targetValue, sourceValue);
		} else if (Array.isArray(sourceValue)) {
			result[key] = cloneConfigValue(sourceValue);
		} else if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
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
			const target = { items: [{ value: 1 }] };
			const sourceArray = [{ value: 2 }, { value: 3 }];
			const source = { items: sourceArray };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ items: [{ value: 2 }, { value: 3 }] });
			sourceArray[0]!.value = 42;
			expect(result).toEqual({ items: [{ value: 2 }, { value: 3 }] });
		});

		it('should replace nested arrays entirely without mutation', () => {
			const target = { nested: { items: [{ value: 1 }] } };
			const nestedSourceArray = [{ value: 2 }, { value: 3 }];
			const source = { nested: { items: nestedSourceArray } };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ nested: { items: [{ value: 2 }, { value: 3 }] } });
			nestedSourceArray[1]!.value = 99;
			expect(result).toEqual({ nested: { items: [{ value: 2 }, { value: 3 }] } });
		});

		it('should merge arrays of objects by index', () => {
			const one = {
				runtimeSettings: [
					{
						audioInputBuffers: [
							{
								memoryId: 'audioin.buffer',
								channel: 0,
								input: 0,
							},
						],
					},
				],
			};

			const two = {
				runtimeSettings: [
					{
						audioOutputBuffers: [
							{
								memoryId: 'audiooutL.buffer',
								channel: 0,
								output: 0,
							},
							{
								memoryId: 'audiooutR.buffer',
								channel: 1,
								output: 0,
							},
						],
					},
				],
			};

			const result = deepMergeConfig(one, two);

			expect(result).toEqual({
				runtimeSettings: [
					{
						audioInputBuffers: [
							{
								memoryId: 'audioin.buffer',
								channel: 0,
								input: 0,
							},
						],
						audioOutputBuffers: [
							{
								memoryId: 'audiooutL.buffer',
								channel: 0,
								output: 0,
							},
							{
								memoryId: 'audiooutR.buffer',
								channel: 1,
								output: 0,
							},
						],
					},
				],
			});
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
