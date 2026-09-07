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

	it('returns the exported buffer function by default', async () => {
		const buffer = vi.fn();
		mockInstantiation({
			main: vi.fn(),
			initDefaults: vi.fn(),
			buffer,
		});

		const result = await createModule(new WebAssembly.Memory({ initial: 1 }), new Uint8Array());

		expect(result.entry).toBe(buffer);
	});

	it('returns the configured entry function', async () => {
		const alternate = vi.fn();
		mockInstantiation({
			main: vi.fn(),
			initDefaults: vi.fn(),
			buffer: vi.fn(),
			alternate,
		});

		const result = await createModule(new WebAssembly.Memory({ initial: 1 }), new Uint8Array(), 'alternate');

		expect(result.entry).toBe(alternate);
	});

	it('returns an empty entry function when the export is missing', async () => {
		mockInstantiation({
			main: vi.fn(),
			initDefaults: vi.fn(),
		});

		const result = await createModule(new WebAssembly.Memory({ initial: 1 }), new Uint8Array());

		expect(result.entry).toBeTypeOf('function');
		expect(() => result.entry()).not.toThrow();
	});
});
