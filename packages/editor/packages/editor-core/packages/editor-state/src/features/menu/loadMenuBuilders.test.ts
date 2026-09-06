import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.doUnmock('./menus');
	vi.resetModules();
});

describe('loadMenuBuilders', () => {
	it('shares one promise for concurrent and later loads', async () => {
		const imported = vi.fn(() => ({ mainMenu: () => [] }));
		vi.doMock('./menus', imported);
		const { default: load } = await import('./loadMenuBuilders');
		expect(imported).not.toHaveBeenCalled();
		const first = load();
		expect(load()).toBe(first);
		await first;
		expect(load()).toBe(first);
		expect(imported).toHaveBeenCalledTimes(1);
	});

	it('clears a rejected promise so the import can be retried', async () => {
		vi.doMock('./menus', () => {
			throw new Error('Unavailable chunk');
		});
		const { default: load } = await import('./loadMenuBuilders');
		const first = load();
		await expect(first).rejects.toThrow();
		// Simulate module availability recovering; retain the same loader instance.
		vi.doMock('./menus', () => ({ mainMenu: () => [] }));
		const retry = load();
		expect(retry).not.toBe(first);
		await expect(retry).resolves.toHaveProperty('mainMenu');
		expect(load()).toBe(retry);
	});
});
