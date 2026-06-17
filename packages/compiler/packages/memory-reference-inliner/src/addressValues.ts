import type { Const, PlannedMemoryDeclaration, PlannedMemoryModule } from '@8f4e/language-spec';
import { getMemoryRegionFields } from '@8f4e/language-spec';

/**
 * Creates a resolved value representing the start byte address of a memory item.
 *
 * @param memoryItem - Memory item whose start address should be represented.
 * @param moduleId - Optional owning module id for intermodule safe-range metadata.
 * @returns Integer value with address safe-range metadata.
 */
export function memoryStartAddressValue(memoryItem: PlannedMemoryDeclaration, moduleId?: string): Const {
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
				safeByteLength: memoryItem.wordAlignedByteLength,
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
export function memoryEndAddressValue(memoryItem: PlannedMemoryDeclaration, moduleId?: string): Const {
	const memoryRegionFields = getMemoryRegionFields(memoryItem.memoryIndex, memoryItem.memoryRegionName);
	return {
		value: memoryItem.endByteAddress,
		isInteger: true,
		address: {
			...memoryRegionFields,
			safeRange: {
				source: 'memory-end',
				...memoryRegionFields,
				byteAddress: memoryItem.endByteAddress,
				safeByteLength: memoryItem.endAddressSafeByteLength,
				...(moduleId ? { moduleId } : {}),
				...(memoryItem.id ? { memoryId: memoryItem.id } : {}),
			},
		},
	};
}

/**
 * Creates a resolved value representing a module start or end byte address.
 *
 * @param module - Module whose address should be represented.
 * @param source - Address source kind to record in safe-range metadata.
 * @param moduleId - Optional module id for safe-range metadata.
 * @returns Integer value with module address safe-range metadata.
 */
export function moduleAddressValue(
	module: PlannedMemoryModule,
	source: 'module-start' | 'module-end',
	moduleId: string | undefined = module.id
): Const {
	const byteAddress = source === 'module-start' ? module.byteAddress : module.endByteAddress;
	const memoryRegionFields = getMemoryRegionFields(module.memoryIndex, module.memoryRegionName);
	return {
		value: byteAddress,
		isInteger: true,
		address: {
			...memoryRegionFields,
			safeRange: {
				source,
				...memoryRegionFields,
				byteAddress,
				safeByteLength: source === 'module-start' ? module.wordAlignedByteLength : module.endAddressSafeByteLength,
				...(moduleId ? { moduleId } : {}),
			},
		},
	};
}
