import type { MemoryViews } from '../../../types';
import type { MemoryIdentifier, TypedValueKind } from '@8f4e/editor-state-types';

export function getBaseValueIndex(
	startAddress: MemoryIdentifier,
	memoryViews: MemoryViews,
	baseSampleShift: 0 | 1 | 2 | 3
): number {
	const startPointerValue = startAddress.showAddress
		? startAddress.memory.byteAddress
		: memoryViews.int32[startAddress.memory.wordAlignedAddress + startAddress.bufferPointer];

	return startPointerValue >> baseSampleShift;
}

export function getTypedValueView(memoryViews: MemoryViews, valueType: TypedValueKind): ArrayLike<number> {
	return memoryViews[valueType];
}
