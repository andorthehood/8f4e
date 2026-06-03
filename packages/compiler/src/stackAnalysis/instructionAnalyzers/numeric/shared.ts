import type { StackItem, StackValueType } from '@8f4e/compiler-spec';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../../../utils/operandTypes';
import { createStackValue } from '../stack';

/** Builds the stack item produced by a two-operand numeric instruction. */
export function numericResult(
	left: StackItem,
	right: StackItem,
	deriveIntegerMetadata?: (left: StackItem, right: StackItem) => Partial<StackItem>
): StackItem {
	const isInteger = areAllOperandsIntegers(left, right);
	const isFloat64 = areAllOperandsFloat64(left, right);
	const integerMetadata = isInteger ? (deriveIntegerMetadata?.(left, right) ?? {}) : {};
	const valueType: StackValueType = isInteger ? 'int' : isFloat64 ? 'float64' : 'float';
	if (isInteger && 'kind' in integerMetadata && integerMetadata.kind === 'address' && integerMetadata.address) {
		return {
			kind: 'address',
			valueType: 'int',
			address: integerMetadata.address,
			...(integerMetadata.pointsTo ? { pointsTo: integerMetadata.pointsTo } : {}),
			...(integerMetadata.knownIntegerValue !== undefined
				? {
						knownIntegerValue: integerMetadata.knownIntegerValue,
						isNonZero: integerMetadata.knownIntegerValue !== 0,
					}
				: {}),
		};
	}

	return createStackValue(valueType, {
		isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
		knownIntegerValue: integerMetadata.knownIntegerValue,
	});
}

/** Builds an integer stack item from optional known integer metadata. */
export function knownIntegerResult(knownIntegerValue: number | undefined, isNonZero = false): StackItem {
	return createStackValue('int', {
		isNonZero: knownIntegerValue !== undefined ? knownIntegerValue !== 0 : isNonZero,
		knownIntegerValue,
	});
}
