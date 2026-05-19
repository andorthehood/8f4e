import type { StackItem } from '@8f4e/compiler-spec';

export function getAddressMemoryIndex(address: StackItem | undefined): number {
	return address?.address?.memoryIndex ?? 0;
}
