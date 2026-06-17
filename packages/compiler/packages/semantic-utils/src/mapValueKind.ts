import type { StackValueType } from '@8f4e/language-spec';

/** Internal scalar kind used to choose typed WASM operations for map rows and values. */
export type MapKind = 'int32' | 'float32' | 'float64';

/**
 * Resolves map value metadata to the internal map kind used for typed WASM emission.
 *
 * @param valueKind - Map or stack value metadata to resolve.
 * @returns The computed result.
 */
export function resolveMapKind(valueKind: { valueType: StackValueType }): MapKind {
	if (valueKind.valueType === 'int') {
		return 'int32';
	}

	return valueKind.valueType === 'float64' ? 'float64' : 'float32';
}
