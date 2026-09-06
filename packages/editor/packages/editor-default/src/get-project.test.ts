import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProject } from './get-project';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('getProject', () => {
	it.each(['https://example.com/project.8f4e', 'https://example.com/project.8f4e?version=2'])(
		'loads an explicit URL without requesting a registry: %s',
		async url => {
			const fetchMock = vi.fn().mockResolvedValue(new Response('8f4e/v1\n'));
			vi.stubGlobal('fetch', fetchMock);

			await expect(getProject(url)).resolves.toBe('8f4e/v1\n');
			expect(fetchMock).toHaveBeenCalledOnce();
			const [requestUrl, options] = fetchMock.mock.calls[0];
			const requested = new URL(requestUrl);
			expect(requested.searchParams.get('_t')).toMatch(/^\d+$/);
			requested.searchParams.delete('_t');
			expect(requested.href).toBe(url);
			expect(options).toEqual({ cache: 'no-store' });
		}
	);

	it('rejects failed project downloads', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Not found', { status: 404 })));

		await expect(getProject('https://example.com/missing.8f4e')).rejects.toThrow('HTTP 404');
	});
});
