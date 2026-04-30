import type { MemoryAddressRange, StackItem } from '@8f4e/compiler-types';

function shiftSafeAddressRange(
	safeAddressRange: MemoryAddressRange,
	byteOffset: number
): MemoryAddressRange | undefined {
	if (!Number.isInteger(byteOffset) || byteOffset < 0 || byteOffset > safeAddressRange.safeByteLength) {
		return undefined;
	}

	return {
		...safeAddressRange,
		byteAddress: safeAddressRange.byteAddress + byteOffset,
		safeByteLength: safeAddressRange.safeByteLength - byteOffset,
	};
}

export function deriveAddStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue + operand2.knownIntegerValue
			: undefined;
	const safeAddressRange =
		operand1.safeAddressRange && operand2.knownIntegerValue !== undefined
			? shiftSafeAddressRange(operand1.safeAddressRange, operand2.knownIntegerValue)
			: operand2.safeAddressRange && operand1.knownIntegerValue !== undefined
				? shiftSafeAddressRange(operand2.safeAddressRange, operand1.knownIntegerValue)
				: undefined;
	const clampAddressRange =
		operand1.clampAddressRange ?? operand1.safeAddressRange ?? operand2.clampAddressRange ?? operand2.safeAddressRange;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeAddressRange ? { safeAddressRange } : {}),
		...(clampAddressRange ? { clampAddressRange } : {}),
	};
}

export function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue - operand2.knownIntegerValue
			: undefined;
	const safeAddressRange =
		operand1.safeAddressRange && operand2.knownIntegerValue !== undefined
			? shiftSafeAddressRange(operand1.safeAddressRange, -operand2.knownIntegerValue)
			: undefined;
	const clampAddressRange = operand1.clampAddressRange ?? operand1.safeAddressRange;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeAddressRange ? { safeAddressRange } : {}),
		...(clampAddressRange ? { clampAddressRange } : {}),
	};
}
