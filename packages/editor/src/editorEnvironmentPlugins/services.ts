import type { EditorEnvironmentWasmExports } from './wasmExports';

export interface EditorEnvironmentPluginServices {
	getWasmExports: () => Promise<EditorEnvironmentWasmExports>;
}

interface CreateEditorEnvironmentPluginServicesOptions {
	getWasmMemory: () => WebAssembly.Memory | null;
	getCodeBuffer: () => Uint8Array;
	loadWasmExportsFactory?: () => Promise<typeof import('./wasmExports').createEditorEnvironmentWasmExports>;
}

interface EditorEnvironmentPluginServicesController {
	services: EditorEnvironmentPluginServices;
	invalidateWasmExports: () => void;
}

async function loadWasmExportsFactory(): Promise<typeof import('./wasmExports').createEditorEnvironmentWasmExports> {
	const module = await import('./wasmExports');

	return module.createEditorEnvironmentWasmExports;
}

export function createEditorEnvironmentPluginServices({
	getWasmMemory,
	getCodeBuffer,
	loadWasmExportsFactory: loadFactory = loadWasmExportsFactory,
}: CreateEditorEnvironmentPluginServicesOptions): EditorEnvironmentPluginServicesController {
	let wasmExports: EditorEnvironmentWasmExports | undefined;
	let wasmExportsPromise: Promise<EditorEnvironmentWasmExports> | undefined;

	return {
		services: {
			getWasmExports: () => {
				wasmExportsPromise ??= loadFactory()
					.then(createEditorEnvironmentWasmExports => {
						wasmExports = createEditorEnvironmentWasmExports({
							getWasmMemory,
							getCodeBuffer,
						});

						return wasmExports;
					})
					.catch(error => {
						wasmExportsPromise = undefined;
						throw error;
					});

				return wasmExportsPromise;
			},
		},
		invalidateWasmExports: () => {
			wasmExports?.invalidate();
		},
	};
}
