import isPlainObject from './isPlainObject';

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
