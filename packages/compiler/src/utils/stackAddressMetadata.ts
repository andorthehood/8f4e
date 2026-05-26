import { getMemoryRegionFields } from '../semantic/memoryRegions';

import type { MemoryAddressRange, StackAddress, StackItem } from '@8f4e/compiler-spec';

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
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, operand2.knownIntegerValue)
			: operand2.kind === 'address' && operand2.address.safeRange && operand1.knownIntegerValue !== undefined
				? shiftSafeRange(operand2.address.safeRange, operand1.knownIntegerValue)
				: undefined;
	const clampRange =
		(operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined) ??
		(operand2.kind === 'address' ? (operand2.address.clampRange ?? operand2.address.safeRange) : undefined);

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
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
				}
			: {}),
	} as Partial<StackAddress>;
}

export function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue - operand2.knownIntegerValue
			: undefined;
	const safeRange =
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, -operand2.knownIntegerValue)
			: undefined;
	const clampRange =
		operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
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
				}
			: {}),
	} as Partial<StackAddress>;
}
