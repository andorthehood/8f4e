/** Resolved memory region identity stored on address metadata. */
export interface ResolvedMemoryRegion {
	memoryIndex: number;
	memoryRegionName?: string;
}

/**
 * Builds the optional memory region fields stored on module and memory metadata.
 *
 * @param memoryIndex - Memory index to resolve.
 * @param memoryRegionName - Configured memory region name to resolve.
 * @returns The computed result.
 */
export function getMemoryRegionFields(memoryIndex: number, memoryRegionName?: string): ResolvedMemoryRegion {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}
