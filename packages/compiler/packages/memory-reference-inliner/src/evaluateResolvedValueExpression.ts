import type { Const, MemoryAddressRange } from '@8f4e/compiler-spec';
import { getMemoryRegionFields } from './memoryRegions';

function shiftSafeRange(safeRange: MemoryAddressRange, byteOffset: number): MemoryAddressRange | undefined {
	if (!Number.isInteger(byteOffset) || byteOffset < 0 || byteOffset > safeRange.safeByteLength) {
		return undefined;
	}

	return {
		...safeRange,
		byteAddress: safeRange.byteAddress + byteOffset,
		safeByteLength: safeRange.safeByteLength - byteOffset,
	};
}

/**
 * Evaluates a binary expression from already resolved operands.
 *
 * @param lhsConst - Resolved left-hand operand.
 * @param rhsConst - Resolved right-hand operand.
 * @param operator - Binary operator from the parsed expression.
 * @returns Folded value with safe-range metadata when address arithmetic remains valid.
 */
export function evaluateResolvedValueExpression(
	lhsConst: Const,
	rhsConst: Const,
	operator: '+' | '-' | '*' | '/' | '^'
): Const {
	const value =
		operator === '+'
			? lhsConst.value + rhsConst.value
			: operator === '-'
				? lhsConst.value - rhsConst.value
				: operator === '*'
					? lhsConst.value * rhsConst.value
					: operator === '/'
						? lhsConst.value / rhsConst.value
						: lhsConst.value ** rhsConst.value;
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);
	const safeRange =
		isInteger && operator === '+' && lhsConst.address?.safeRange && rhsConst.isInteger
			? shiftSafeRange(lhsConst.address.safeRange, rhsConst.value)
			: isInteger && operator === '+' && rhsConst.address?.safeRange && lhsConst.isInteger
				? shiftSafeRange(rhsConst.address.safeRange, lhsConst.value)
				: isInteger && operator === '-' && lhsConst.address?.safeRange && rhsConst.isInteger
					? shiftSafeRange(lhsConst.address.safeRange, -rhsConst.value)
					: undefined;

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
		...(safeRange
			? {
					address: {
						...getMemoryRegionFields(safeRange.memoryIndex, safeRange.memoryRegionName),
						safeRange,
					},
				}
			: {}),
	};
}
