import type { Const, DataStructure } from '@8f4e/compiler-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { getEndByteAddress } from './layoutAddresses';
import { getMemoryRegionFields } from './memoryRegions';

/**
 * Converts word-aligned size to the byte length that is safe from the memory start address.
 *
 * @param wordAlignedSize - Size measured in aligned memory words.
 * @returns Safe byte length available from the start address.
 */
export function getWordAlignedByteLength(wordAlignedSize: number): number {
	return Math.max(0, wordAlignedSize) * GLOBAL_ALIGNMENT_BOUNDARY;
}

/**
 * Converts word-aligned size to the byte length that is safe from the memory end address.
 *
 * @param wordAlignedSize - Size measured in aligned memory words.
 * @returns Safe byte length available from the end address.
 */
export function getEndAddressSafeByteLength(wordAlignedSize: number): number {
	return wordAlignedSize > 0 ? GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

/**
 * Creates a resolved value representing the start byte address of a memory item.
 *
 * @param memoryItem - Memory item whose start address should be represented.
 * @param moduleId - Optional owning module id for intermodule safe-range metadata.
 * @returns Integer value with address safe-range metadata.
 */
export function memoryStartAddressValue(memoryItem: DataStructure, moduleId?: string): Const {
	const memoryRegionFields = getMemoryRegionFields(memoryItem.memoryIndex, memoryItem.memoryRegionName);
	return {
		value: memoryItem.byteAddress,
		isInteger: true,
		address: {
			...memoryRegionFields,
			safeRange: {
				source: 'memory-start',
				...memoryRegionFields,
				byteAddress: memoryItem.byteAddress,
				safeByteLength: getWordAlignedByteLength(memoryItem.wordAlignedSize),
				...(moduleId ? { moduleId } : {}),
				...(memoryItem.id ? { memoryId: memoryItem.id } : {}),
			},
		},
	};
}

/**
 * Creates a resolved value representing the end byte address of a memory item.
 *
 * @param memoryItem - Memory item whose end address should be represented.
 * @param moduleId - Optional owning module id for intermodule safe-range metadata.
 * @returns Integer value with address safe-range metadata.
 */
export function memoryEndAddressValue(memoryItem: DataStructure, moduleId?: string): Const {
	const byteAddress = getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize);
	const memoryRegionFields = getMemoryRegionFields(memoryItem.memoryIndex, memoryItem.memoryRegionName);
	return {
		value: byteAddress,
		isInteger: true,
		address: {
			...memoryRegionFields,
			safeRange: {
				source: 'memory-end',
				...memoryRegionFields,
				byteAddress,
				safeByteLength: getEndAddressSafeByteLength(memoryItem.wordAlignedSize),
				...(moduleId ? { moduleId } : {}),
				...(memoryItem.id ? { memoryId: memoryItem.id } : {}),
			},
		},
	};
}

/**
 * Creates a resolved value representing a module start or end byte address.
 *
 * @param source - Address source kind to record in safe-range metadata.
 * @param byteAddress - Resolved module byte address.
 * @param wordAlignedSize - Module size in aligned words.
 * @param moduleId - Optional module id for safe-range metadata.
 * @param memoryIndex - Memory region index for the address.
 * @param memoryRegionName - Optional named memory region.
 * @returns Integer value with module address safe-range metadata.
 */
export function moduleAddressValue(
	source: 'module-start' | 'module-end',
	byteAddress: number,
	wordAlignedSize: number,
	moduleId?: string,
	memoryIndex = 0,
	memoryRegionName?: string
): Const {
	const memoryRegionFields = getMemoryRegionFields(memoryIndex, memoryRegionName);
	return {
		value: byteAddress,
		isInteger: true,
		address: {
			...memoryRegionFields,
			safeRange: {
				source,
				...memoryRegionFields,
				byteAddress,
				safeByteLength:
					source === 'module-start'
						? getWordAlignedByteLength(wordAlignedSize)
						: getEndAddressSafeByteLength(wordAlignedSize),
				...(moduleId ? { moduleId } : {}),
			},
		},
	};
}
