import type { MemoryAddressRange, StackAddress, StackItem } from '@8f4e/language-spec';
import { getMemoryRegionFields } from '@8f4e/language-spec';

/** Shifts a proven safe range forward by a known byte offset, dropping it when unsafe. */
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
 * Derives known-value and address-range metadata for stack addition.
 *
 * @param operand1 - First stack operand.
 * @param operand2 - Second stack operand.
 * @returns The computed result.
 */
export function deriveAddStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownValue =
		operand1.knownValue !== undefined && operand2.knownValue !== undefined
			? operand1.knownValue + operand2.knownValue
			: undefined;
	const safeRange =
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, operand2.knownValue)
			: operand2.kind === 'address' && operand2.address.safeRange && operand1.knownValue !== undefined
				? shiftSafeRange(operand2.address.safeRange, operand1.knownValue)
				: undefined;
	const clampRange =
		(operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined) ??
		(operand2.kind === 'address' ? (operand2.address.clampRange ?? operand2.address.safeRange) : undefined);
	const pointsTo =
		operand1.kind === 'address' && operand1.pointsTo
			? operand1.pointsTo
			: operand2.kind === 'address'
				? operand2.pointsTo
				: undefined;

	return {
		...(knownValue !== undefined ? { knownValue } : {}),
		...(safeRange || clampRange
			? {
					kind: 'address',
					valueType: 'int',
					address: {
						...getMemoryRegionFields(
							(safeRange ?? clampRange)!.memoryIndex,
							(safeRange ?? clampRange)!.memoryRegionName
						),
						...(safeRange ? { safeRange } : {}),
						...(clampRange ? { clampRange } : {}),
					},
					...(pointsTo ? { pointsTo } : {}),
				}
			: {}),
	} as Partial<StackAddress>;
}

/**
 * Derives known-value and address-range metadata for stack subtraction.
 *
 * @param operand1 - First stack operand.
 * @param operand2 - Second stack operand.
 * @returns The computed result.
 */
export function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownValue =
		operand1.knownValue !== undefined && operand2.knownValue !== undefined
			? operand1.knownValue - operand2.knownValue
			: undefined;
	const safeRange =
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, -operand2.knownValue)
			: undefined;
	const clampRange =
		operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined;
	const pointsTo = operand1.kind === 'address' ? operand1.pointsTo : undefined;

	return {
		...(knownValue !== undefined ? { knownValue } : {}),
		...(safeRange || clampRange
			? {
					kind: 'address',
					valueType: 'int',
					address: {
						...getMemoryRegionFields(
							(safeRange ?? clampRange)!.memoryIndex,
							(safeRange ?? clampRange)!.memoryRegionName
						),
						...(safeRange ? { safeRange } : {}),
						...(clampRange ? { clampRange } : {}),
					},
					...(pointsTo ? { pointsTo } : {}),
				}
			: {}),
	} as Partial<StackAddress>;
}
