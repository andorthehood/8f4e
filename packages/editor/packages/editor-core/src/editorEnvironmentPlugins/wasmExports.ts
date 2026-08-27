export interface EditorEnvironmentWasmExports {
	getExports: () => Promise<WebAssembly.Exports | undefined>;
	invalidate: () => void;
}

interface CreateEditorEnvironmentWasmExportsOptions {
	getWasmMemory: () => WebAssembly.Memory | null;
	getCodeBuffer: () => Uint8Array;
	instantiate?: (
		memory: WebAssembly.Memory,
		codeBuffer: Uint8Array
	) => Promise<WebAssembly.Exports> | WebAssembly.Exports;
}

async function instantiateWasmExports(
	memory: WebAssembly.Memory,
	codeBuffer: Uint8Array
): Promise<WebAssembly.Exports> {
	const { instance } = (await WebAssembly.instantiate(codeBuffer, {
		host: {
			memory,
		},
	})) as unknown as WebAssembly.WebAssemblyInstantiatedSource;

	return instance.exports;
}

export function createEditorEnvironmentWasmExports({
	getWasmMemory,
	getCodeBuffer,
	instantiate = instantiateWasmExports,
}: CreateEditorEnvironmentWasmExportsOptions): EditorEnvironmentWasmExports {
	let cachedMemory: WebAssembly.Memory | null = null;
	let cachedCodeBuffer: Uint8Array | undefined;
	let cachedExports: WebAssembly.Exports | undefined;
	let pendingMemory: WebAssembly.Memory | null = null;
	let pendingCodeBuffer: Uint8Array | undefined;
	let pendingExports: Promise<WebAssembly.Exports | undefined> | undefined;
	let generation = 0;

	function clearCache(): void {
		cachedMemory = null;
		cachedCodeBuffer = undefined;
		cachedExports = undefined;
		pendingMemory = null;
		pendingCodeBuffer = undefined;
		pendingExports = undefined;
	}

	return {
		getExports: async () => {
			const memory = getWasmMemory();
			const codeBuffer = getCodeBuffer();

			if (!memory || codeBuffer.length === 0) {
				return undefined;
			}

			if (cachedExports && cachedMemory === memory && cachedCodeBuffer === codeBuffer) {
				return cachedExports;
			}

			if (pendingExports && pendingMemory === memory && pendingCodeBuffer === codeBuffer) {
				return pendingExports;
			}

			const instantiateGeneration = generation;
			pendingMemory = memory;
			pendingCodeBuffer = codeBuffer;
			let instantiatePromise: Promise<WebAssembly.Exports | undefined>;
			instantiatePromise = Promise.resolve(instantiate(memory, codeBuffer))
				.then(exports => {
					if (generation !== instantiateGeneration || pendingExports !== instantiatePromise) {
						return undefined;
					}

					cachedMemory = memory;
					cachedCodeBuffer = codeBuffer;
					cachedExports = exports;
					pendingMemory = null;
					pendingCodeBuffer = undefined;
					pendingExports = undefined;

					return exports;
				})
				.catch(error => {
					if (pendingExports === instantiatePromise) {
						pendingMemory = null;
						pendingCodeBuffer = undefined;
						pendingExports = undefined;
					}

					throw error;
				});
			pendingExports = instantiatePromise;

			return instantiatePromise;
		},
		invalidate: () => {
			generation++;
			clearCache();
		},
	};
}
