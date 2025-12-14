import type { MemoryAction } from './memoryReinitTypes';

let memoryRefCache: WebAssembly.Memory | null = null;
let currentMemorySize = 0;
const WASM_PAGE_SIZE = 65536;

export function getOrCreateMemory(
	memorySizeBytes: number,
	memoryStructureChanged: boolean
): { hasMemoryBeenReset: boolean; memoryRef: WebAssembly.Memory; memoryAction: MemoryAction } {
	const memorySizeChange = currentMemorySize !== memorySizeBytes;
	const shouldRecreate = memoryStructureChanged || memorySizeChange;
	let hasMemoryBeenReset = false;
	let memoryAction: MemoryAction;

	if (!memoryRefCache) {
		// No existing memory instance
		const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);

		memoryRefCache = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
		currentMemorySize = memorySizeBytes;

		hasMemoryBeenReset = true;
		memoryAction = { action: 'recreated', reason: { kind: 'no-instance' } };
	} else if (shouldRecreate) {
		// Existing memory, but needs to be recreated
		const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);
		const prevBytes = currentMemorySize;

		memoryRefCache = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
		currentMemorySize = memorySizeBytes;

		hasMemoryBeenReset = true;

		// Determine the reason for recreation
		if (memorySizeChange) {
			memoryAction = {
				action: 'recreated',
				reason: { kind: 'memory-size-changed', prevBytes, nextBytes: memorySizeBytes },
			};
		} else {
			// memoryStructureChanged must be true
			memoryAction = { action: 'recreated', reason: { kind: 'memory-structure-changed' } };
		}
	} else {
		// Memory is being reused
		memoryAction = { action: 'reused' };
	}

	return { hasMemoryBeenReset, memoryRef: memoryRefCache, memoryAction };
}
