import { afterEach, describe, expect, it, vi } from 'vitest';

import createModule from './createModule';

function mockInstantiation(exports: WebAssembly.Exports) {
	vi.spyOn(WebAssembly, 'instantiate').mockResolvedValue({
		instance: { exports } as WebAssembly.Instance,
		module: {} as WebAssembly.Module,
	} as WebAssembly.WebAssemblyInstantiatedSource);
}

describe('createModule', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns the exported buffer function when present', async () => {
		const buffer = vi.fn();
		mockInstantiation({
			main: vi.fn(),
			initDefaults: vi.fn(),
			buffer,
		});

		const result = await createModule(new WebAssembly.Memory({ initial: 1 }), new Uint8Array());

		expect(result.buffer).toBe(buffer);
	});

	it('returns an empty buffer function when the export is missing', async () => {
		mockInstantiation({
			main: vi.fn(),
			initDefaults: vi.fn(),
		});

		const result = await createModule(new WebAssembly.Memory({ initial: 1 }), new Uint8Array());

		expect(result.buffer).toBeTypeOf('function');
		expect(() => result.buffer()).not.toThrow();
	});
});
