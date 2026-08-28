import { describe, expect, it, vi } from 'vitest';

import { createEditorEnvironmentPluginServices } from './services';

import type { EditorEnvironmentWasmExports } from './wasmExports';

function createMemory(): WebAssembly.Memory {
	return new WebAssembly.Memory({ initial: 1 });
}

describe('createEditorEnvironmentPluginServices', () => {
	it('loads the Wasm exports provider only when a plugin asks for it', async () => {
		const wasmExports: EditorEnvironmentWasmExports = {
			getExports: vi.fn(async () => undefined),
			invalidate: vi.fn(),
		};
		const createWasmExports = vi.fn(() => wasmExports);
		const loadWasmExportsFactory = vi.fn(async () => createWasmExports);
		const pluginServices = createEditorEnvironmentPluginServices({
			getWasmMemory: () => createMemory(),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			loadWasmExportsFactory,
		});

		pluginServices.invalidateWasmExports();

		expect(loadWasmExportsFactory).not.toHaveBeenCalled();
		expect(wasmExports.invalidate).not.toHaveBeenCalled();

		await expect(pluginServices.services.getWasmExports()).resolves.toBe(wasmExports);

		expect(loadWasmExportsFactory).toHaveBeenCalledTimes(1);
		expect(createWasmExports).toHaveBeenCalledTimes(1);
		expect(createWasmExports).toHaveBeenCalledWith({
			getWasmMemory: expect.any(Function),
			getCodeBuffer: expect.any(Function),
		});
	});

	it('shares one loaded Wasm exports provider across callers', async () => {
		const wasmExports: EditorEnvironmentWasmExports = {
			getExports: vi.fn(async () => undefined),
			invalidate: vi.fn(),
		};
		const createWasmExports = vi.fn(() => wasmExports);
		let resolveLoad: (factory: typeof createWasmExports) => void = () => {};
		const loadWasmExportsFactory = vi.fn(
			() =>
				new Promise<typeof createWasmExports>(resolve => {
					resolveLoad = resolve;
				})
		);
		const pluginServices = createEditorEnvironmentPluginServices({
			getWasmMemory: () => createMemory(),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			loadWasmExportsFactory,
		});

		const first = pluginServices.services.getWasmExports();
		const second = pluginServices.services.getWasmExports();

		resolveLoad(createWasmExports);

		await expect(Promise.all([first, second])).resolves.toEqual([wasmExports, wasmExports]);
		expect(loadWasmExportsFactory).toHaveBeenCalledTimes(1);
		expect(createWasmExports).toHaveBeenCalledTimes(1);
	});

	it('invalidates the loaded provider without forcing creation', async () => {
		const wasmExports: EditorEnvironmentWasmExports = {
			getExports: vi.fn(async () => undefined),
			invalidate: vi.fn(),
		};
		const loadWasmExportsFactory = vi.fn(async () => vi.fn(() => wasmExports));
		const pluginServices = createEditorEnvironmentPluginServices({
			getWasmMemory: () => createMemory(),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			loadWasmExportsFactory,
		});

		pluginServices.invalidateWasmExports();
		expect(loadWasmExportsFactory).not.toHaveBeenCalled();

		await pluginServices.services.getWasmExports();
		pluginServices.invalidateWasmExports();

		expect(wasmExports.invalidate).toHaveBeenCalledTimes(1);
	});

	it('retries provider loading after a failed dynamic import', async () => {
		const wasmExports: EditorEnvironmentWasmExports = {
			getExports: vi.fn(async () => undefined),
			invalidate: vi.fn(),
		};
		const loadWasmExportsFactory = vi
			.fn()
			.mockRejectedValueOnce(new Error('nope'))
			.mockResolvedValueOnce(vi.fn(() => wasmExports));
		const pluginServices = createEditorEnvironmentPluginServices({
			getWasmMemory: () => createMemory(),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			loadWasmExportsFactory,
		});

		await expect(pluginServices.services.getWasmExports()).rejects.toThrow('nope');
		await expect(pluginServices.services.getWasmExports()).resolves.toBe(wasmExports);

		expect(loadWasmExportsFactory).toHaveBeenCalledTimes(2);
	});
});
