import type { MemoryAddressRange, StackItem } from '@8f4e/compiler-spec';

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

export function deriveAddStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue + operand2.knownIntegerValue
			: undefined;
	const safeRange =
		operand1.address?.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, operand2.knownIntegerValue)
			: operand2.address?.safeRange && operand1.knownIntegerValue !== undefined
				? shiftSafeRange(operand2.address.safeRange, operand1.knownIntegerValue)
				: undefined;
	const clampRange =
		operand1.address?.clampRange ??
		operand1.address?.safeRange ??
		operand2.address?.clampRange ??
		operand2.address?.safeRange;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeRange || clampRange
			? { address: { ...(safeRange ? { safeRange } : {}), ...(clampRange ? { clampRange } : {}) } }
			: {}),
	};
}

export function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue - operand2.knownIntegerValue
			: undefined;
	const safeRange =
		operand1.address?.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, -operand2.knownIntegerValue)
			: undefined;
	const clampRange = operand1.address?.clampRange ?? operand1.address?.safeRange;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeRange || clampRange
			? { address: { ...(safeRange ? { safeRange } : {}), ...(clampRange ? { clampRange } : {}) } }
			: {}),
	};
}
