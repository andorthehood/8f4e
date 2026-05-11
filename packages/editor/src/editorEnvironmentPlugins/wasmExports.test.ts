import { describe, expect, it, vi } from 'vitest';

import { createEditorEnvironmentWasmExports } from './wasmExports';

function createMemory(): WebAssembly.Memory {
	return new WebAssembly.Memory({ initial: 1 });
}

describe('createEditorEnvironmentWasmExports', () => {
	it('does not instantiate without memory or compiled code', async () => {
		let memory: WebAssembly.Memory | null = null;
		let codeBuffer = new Uint8Array([1, 2, 3]);
		const instantiate = vi.fn(async () => ({}) as WebAssembly.Exports);
		const wasmExports = createEditorEnvironmentWasmExports({
			getWasmMemory: () => memory,
			getCodeBuffer: () => codeBuffer,
			instantiate,
		});

		await expect(wasmExports.getExports()).resolves.toBeUndefined();

		memory = createMemory();
		codeBuffer = new Uint8Array();
		await expect(wasmExports.getExports()).resolves.toBeUndefined();

		expect(instantiate).not.toHaveBeenCalled();
	});

	it('caches exports for the current memory and code buffer', async () => {
		const memory = createMemory();
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const exports = { onMidiIn: vi.fn() } as WebAssembly.Exports;
		const instantiate = vi.fn(async () => exports);
		const wasmExports = createEditorEnvironmentWasmExports({
			getWasmMemory: () => memory,
			getCodeBuffer: () => codeBuffer,
			instantiate,
		});

		await expect(wasmExports.getExports()).resolves.toBe(exports);
		await expect(wasmExports.getExports()).resolves.toBe(exports);

		expect(instantiate).toHaveBeenCalledTimes(1);
	});

	it('shares an in-flight instantiation for matching memory and code buffer', async () => {
		const memory = createMemory();
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const exports = { onMidiIn: vi.fn() } as WebAssembly.Exports;
		let resolveInstantiate: (exports: WebAssembly.Exports) => void = () => {};
		const instantiate = vi.fn(
			() =>
				new Promise<WebAssembly.Exports>(resolve => {
					resolveInstantiate = resolve;
				})
		);
		const wasmExports = createEditorEnvironmentWasmExports({
			getWasmMemory: () => memory,
			getCodeBuffer: () => codeBuffer,
			instantiate,
		});

		const first = wasmExports.getExports();
		const second = wasmExports.getExports();

		resolveInstantiate(exports);

		await expect(Promise.all([first, second])).resolves.toEqual([exports, exports]);
		expect(instantiate).toHaveBeenCalledTimes(1);
	});

	it('invalidates pending and cached exports', async () => {
		const memory = createMemory();
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const oldExports = { oldHandler: vi.fn() } as WebAssembly.Exports;
		const newExports = { newHandler: vi.fn() } as WebAssembly.Exports;
		let resolveInstantiate: (exports: WebAssembly.Exports) => void = () => {};
		const instantiate = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<WebAssembly.Exports>(resolve => {
						resolveInstantiate = resolve;
					})
			)
			.mockResolvedValueOnce(newExports);
		const wasmExports = createEditorEnvironmentWasmExports({
			getWasmMemory: () => memory,
			getCodeBuffer: () => codeBuffer,
			instantiate,
		});

		const staleExports = wasmExports.getExports();
		wasmExports.invalidate();
		resolveInstantiate(oldExports);

		await expect(staleExports).resolves.toBeUndefined();
		await expect(wasmExports.getExports()).resolves.toBe(newExports);
		await expect(wasmExports.getExports()).resolves.toBe(newExports);
		expect(instantiate).toHaveBeenCalledTimes(2);
	});

	it('clears failed pending exports so the next call can retry', async () => {
		const memory = createMemory();
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const exports = { onMidiIn: vi.fn() } as WebAssembly.Exports;
		const instantiate = vi.fn().mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce(exports);
		const wasmExports = createEditorEnvironmentWasmExports({
			getWasmMemory: () => memory,
			getCodeBuffer: () => codeBuffer,
			instantiate,
		});

		await expect(wasmExports.getExports()).rejects.toThrow('nope');
		await expect(wasmExports.getExports()).resolves.toBe(exports);

		expect(instantiate).toHaveBeenCalledTimes(2);
	});
});
