let memoryRefCache: WebAssembly.Memory | null = null;
let currentMemorySize = 0;
const WASM_PAGE_SIZE = 65536;

export function getOrCreateMemory(
	memorySizeBytes: number,
	memoryStructureChanged: boolean
): { hasMemoryBeenReset: boolean; memoryRef: WebAssembly.Memory } {
	const memorySizeChange = currentMemorySize !== memorySizeBytes;
	const shouldRecreate = memoryStructureChanged || memorySizeChange;
	let hasMemoryBeenReset = false;
	if (!memoryRefCache || shouldRecreate) {
		const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);

		memoryRefCache = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
		currentMemorySize = memorySizeBytes;

		hasMemoryBeenReset = true;
	}

	return { hasMemoryBeenReset, memoryRef: memoryRefCache };
}
