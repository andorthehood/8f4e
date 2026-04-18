import type { MemoryMap } from '@8f4e/compiler-memory-layout';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}
