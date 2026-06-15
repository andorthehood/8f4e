import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';

export type ModuleAddressCursor = Record<number, number>;

/**
 * Creates module placement state keyed by WebAssembly memory index.
 *
 * @param startingByteAddress - Initial byte address for every memory region.
 * @returns Mutable cursor state used by the module planner.
 */
export function createModuleAddressCursor(startingByteAddress: number): ModuleAddressCursor {
	return { 0: startingByteAddress };
}

/**
 * Returns the next module start address for the requested memory index.
 *
 * @param cursor - Module placement state.
 * @param memoryIndex - WebAssembly memory index to place into.
 * @param fallbackStartingByteAddress - Initial byte address for previously unused regions.
 * @returns The byte address where the next module in this region starts.
 */
export function getNextModuleByteAddress(
	cursor: ModuleAddressCursor,
	memoryIndex: number,
	fallbackStartingByteAddress: number
): number {
	return cursor[memoryIndex] ?? fallbackStartingByteAddress;
}

/**
 * Advances a memory region cursor after placing a module.
 *
 * @param cursor - Module placement state.
 * @param memoryIndex - WebAssembly memory index that received a module.
 * @param moduleByteAddress - Byte address assigned to the placed module.
 * @param moduleWordAlignedSize - Module size in 4-byte words.
 * @returns The updated byte address for the region.
 */
export function advanceModuleByteAddress(
	cursor: ModuleAddressCursor,
	memoryIndex: number,
	moduleByteAddress: number,
	moduleWordAlignedSize: number
): number {
	const nextByteAddress = moduleByteAddress + moduleWordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
	cursor[memoryIndex] = nextByteAddress;
	return nextByteAddress;
}
