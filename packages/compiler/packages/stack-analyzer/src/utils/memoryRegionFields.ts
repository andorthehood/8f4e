import type { MemoryRegionIdentity } from '@8f4e/compiler-spec';

export function getMemoryRegionFields(memoryIndex: number, memoryRegionName?: string): MemoryRegionIdentity {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}
