import type { MemoryAddressRange, StackItem } from '@8f4e/compiler-types';

function shiftMemoryAddressRange(
	memoryAddress: MemoryAddressRange,
	byteOffset: number
): MemoryAddressRange | undefined {
	if (!Number.isInteger(byteOffset) || byteOffset < 0 || byteOffset > memoryAddress.safeByteLength) {
		return undefined;
	}

	return {
		...memoryAddress,
		byteAddress: memoryAddress.byteAddress + byteOffset,
		safeByteLength: memoryAddress.safeByteLength - byteOffset,
	};
}

export function deriveAddStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue + operand2.knownIntegerValue
			: undefined;
	const memoryAddress =
		operand1.memoryAddress && operand2.knownIntegerValue !== undefined
			? shiftMemoryAddressRange(operand1.memoryAddress, operand2.knownIntegerValue)
			: operand2.memoryAddress && operand1.knownIntegerValue !== undefined
				? shiftMemoryAddressRange(operand2.memoryAddress, operand1.knownIntegerValue)
				: undefined;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(memoryAddress ? { memoryAddress } : {}),
	};
}

export function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue - operand2.knownIntegerValue
			: undefined;
	const memoryAddress =
		operand1.memoryAddress && operand2.knownIntegerValue !== undefined
			? shiftMemoryAddressRange(operand1.memoryAddress, -operand2.knownIntegerValue)
			: undefined;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(memoryAddress ? { memoryAddress } : {}),
	};
}
