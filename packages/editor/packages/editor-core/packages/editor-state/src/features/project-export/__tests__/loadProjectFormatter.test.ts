import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.doUnmock('../serializeTo8f4e');
	vi.resetModules();
});

describe('loadProjectFormatter', () => {
	it('shares one import promise across concurrent and later exports', async () => {
		const imported = vi.fn(() => ({ serializeProjectTo8f4e: () => '' }));
		vi.doMock('../serializeTo8f4e', imported);
		const { default: load } = await import('../loadProjectFormatter');
		expect(imported).not.toHaveBeenCalled();
		const first = load();
		expect(load()).toBe(first);
		await first;
		expect(load()).toBe(first);
		expect(imported).toHaveBeenCalledOnce();
	});

	it('retries the import after a recoverable failure', async () => {
		vi.doMock('../serializeTo8f4e', () => {
			throw new Error('Unavailable');
		});
		const { default: load } = await import('../loadProjectFormatter');
		const first = load();
		await expect(first).rejects.toThrow();
		vi.doMock('../serializeTo8f4e', () => ({ serializeProjectTo8f4e: () => '' }));
		const retry = load();
		expect(retry).not.toBe(first);
		await expect(retry).resolves.toHaveProperty('serializeProjectTo8f4e');
	});
});
