import type { MemoryMap } from '@8f4e/compiler-spec';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}
